/**
 * FASE 3.3 — Audita aplicação MP + probes HTTP do webhook (sem imprimir secrets).
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID, createHmac } from "node:crypto";
import { fetchWithVercelBypass } from "./http-with-vercel-bypass.mjs";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

const verify = loadEnvFile(path.join(process.cwd(), "apps/web/.env.preview.verify"));
const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
for (const [k, v] of Object.entries({ ...verify, ...e2e })) {
  if (!process.env[k]) process.env[k] = v;
}
for (const k of ["VERCEL_AUTOMATION_BYPASS_SECRET", "E2E_TEST_SECRET"]) {
  if (e2e[k]) process.env[k] = e2e[k];
}

const WEB = process.env.WEB_URL || "https://homolog.eccopet.com";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || "";
const token =
  process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() ||
  verify.MERCADO_PAGO_ACCESS_TOKEN?.trim() ||
  "";
const whSecret =
  process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ||
  verify.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ||
  "";
const pub =
  process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim() ||
  verify.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim() ||
  "";

const report = {
  web: WEB,
  bypassPresent: Boolean(bypass),
  whSecretPresent: Boolean(whSecret) && !whSecret.includes("SENSITIVE"),
  tokenPresent: Boolean(token) && !token.includes("SENSITIVE"),
  tokenPrefix: token ? token.slice(0, 8) : null,
  pubPrefix: pub ? pub.slice(0, 10) : null,
  mpEnvLocal: process.env.MERCADO_PAGO_ENVIRONMENT || verify.MERCADO_PAGO_ENVIRONMENT || null,
  mpApp: {},
  webhookProbes: {},
  apiProbes: {},
};

async function mpGet(urlPath) {
  const res = await fetch(`https://api.mercadopago.com${urlPath}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, json, textLen: text.length };
}

// Prefer runtime Preview credentials for charge path — still audit local/verify token shape
const cfgRes = await fetchWithVercelBypass(`${WEB}/api/health`);
const health = await cfgRes.json().catch(() => ({}));
report.health = {
  status: cfgRes.status,
  database: health.database || health.data?.database || null,
};

// Login client to get runtime config (environment/publicKey)
// Skip if no e2e session path — use admin diagnostics later

if (token) {
  const me = await mpGet("/users/me");
  report.mpApp.usersMe = {
    status: me.status,
    id: me.json?.id ?? null,
    nickname: me.json?.nickname ? String(me.json.nickname).slice(0, 24) : null,
    siteId: me.json?.site_id ?? null,
    emailDomain: me.json?.email ? String(me.json.email).split("@")[1] : null,
  };

  // Application info endpoints (may 404 depending on token type)
  for (const p of [
    "/applications",
    "/v1/applications",
    "/oauth/applications",
  ]) {
    const r = await mpGet(p);
    report.apiProbes[p] = {
      status: r.status,
      keys: r.json && typeof r.json === "object" ? Object.keys(r.json).slice(0, 12) : null,
      count: Array.isArray(r.json) ? r.json.length : r.json?.results?.length ?? null,
    };
  }

  // Recent orders search if available
  const ordersSearch = await mpGet("/v1/orders/search?limit=3");
  report.apiProbes["/v1/orders/search"] = {
    status: ordersSearch.status,
    hasResults: Boolean(ordersSearch.json?.data || ordersSearch.json?.results || ordersSearch.json?.elements),
  };

  // Get last known order from env or skip
  const lastOrd = process.env.PROBE_ORDER_ID || "ORDTST01KZHX2HTPB90NY53GS3DN65P9";
  const ord = await mpGet(`/v1/orders/${encodeURIComponent(lastOrd)}`);
  report.apiProbes.lastOrder = {
    status: ord.status,
    id: ord.json?.id ? String(ord.json.id).slice(0, 12) + "…" : null,
    statusMp: ord.json?.status ?? null,
    statusDetail: ord.json?.status_detail ?? null,
    externalReferencePrefix: ord.json?.external_reference
      ? String(ord.json.external_reference).slice(0, 10)
      : null,
    hasNotificationUrl: Boolean(
      ord.json?.notification_url || ord.json?.notifications?.url
    ),
    notificationUrlHost: (() => {
      const u = ord.json?.notification_url || ord.json?.notifications?.url;
      if (!u) return null;
      try {
        return new URL(String(u)).host;
      } catch {
        return "invalid_url";
      }
    })(),
    liveMode: ord.json?.live_mode ?? null,
  };
}

// --- Webhook URL probes ---
const whPath = "/api/webhooks/mercado-pago";
const withBypass = `${WEB}${whPath}?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
const withoutBypass = `${WEB}${whPath}`;

async function classify(res, bodyText) {
  const loc = res.headers.get("location") || "";
  const server = res.headers.get("server") || "";
  const body = bodyText.slice(0, 200);
  let kind = "UNKNOWN";
  if (res.status === 302 || (res.status === 401 && /sso|vercel\.com\/sso|login/i.test(loc + body))) {
    kind = "VERCEL_BLOCK";
  } else if (res.status === 401 && /SIGNATURE|assinatura|Webhook rejeitado/i.test(body)) {
    kind = "ECCOPET_401";
  } else if (res.status === 404) kind = "NOT_FOUND";
  else if (res.status === 405) kind = "METHOD_NOT_ALLOWED";
  else if (res.status >= 500) kind = "SERVER_ERROR";
  else if (res.status === 200 || res.status === 201) kind = "APP_OK";
  return { status: res.status, kind, locationPrefix: loc.slice(0, 60) || null, server: server.slice(0, 40) || null, bodySnippet: body.replace(/[A-Za-z0-9_-]{20,}/g, "***") };
}

// GET bare
{
  const res = await fetch(withoutBypass, { method: "GET", redirect: "manual" });
  const t = await res.text().catch(() => "");
  report.webhookProbes.getBare = await classify(res, t);
}
// GET with bypass query
{
  const res = await fetch(withBypass, { method: "GET", redirect: "manual" });
  const t = await res.text().catch(() => "");
  report.webhookProbes.getWithBypassQuery = await classify(res, t);
}
// HEAD with bypass
{
  const res = await fetch(withBypass, { method: "HEAD", redirect: "manual" });
  report.webhookProbes.headWithBypass = {
    status: res.status,
    kind: res.status === 302 ? "VERCEL_BLOCK" : res.status === 200 ? "APP_OK" : "OTHER",
  };
}
// POST bare (no bypass) — invalid signature body
{
  const res = await fetch(withoutBypass, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/json", "x-request-id": randomUUID() },
    body: JSON.stringify({
      action: "payment.updated",
      type: "order",
      data: { id: "ORDTST_PROBE" },
      live_mode: false,
    }),
  });
  const t = await res.text().catch(() => "");
  report.webhookProbes.postBare = await classify(res, t);
}
// POST with bypass query — invalid signature (expect EccoPet 401)
{
  const res = await fetch(withBypass, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      "x-signature": "ts=1,v1=deadbeef",
      "x-request-id": randomUUID(),
    },
    body: JSON.stringify({
      action: "order.updated",
      type: "order",
      data: { id: "ORDTST_PROBE_INVALID_SIG" },
      live_mode: false,
    }),
  });
  const t = await res.text().catch(() => "");
  report.webhookProbes.postBypassInvalidSig = await classify(res, t);
}
// POST with bypass header only (no query)
{
  const res = await fetch(withoutBypass, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      "x-vercel-protection-bypass": bypass,
      "x-signature": "ts=1,v1=deadbeef",
      "x-request-id": randomUUID(),
    },
    body: JSON.stringify({
      action: "order.updated",
      type: "orders",
      data: { id: "ORDTST_PROBE_HDR" },
      live_mode: false,
    }),
  });
  const t = await res.text().catch(() => "");
  report.webhookProbes.postBypassHeaderInvalidSig = await classify(res, t);
}

// Expected URL shape (sanitized)
report.expectedWebhookUrlShape = {
  host: "homolog.eccopet.com",
  path: "/api/webhooks/mercado-pago",
  requiresBypassQuery: true,
  bypassQueryParam: "x-vercel-protection-bypass",
  bypassSecretPrinted: false,
  note: "URL no painel MP (modo teste) deve incluir query de bypass; secret não documentado",
};

report.ordersTopicRequirement = {
  product: "Checkout Transparente / API Orders",
  requiredPanelEvent: "Order (Mercado Pago)",
  requiredTopic: "orders",
  legacyPaymentTopic: "payment",
  legacySufficientForOrders: false,
  appHandlerSupports: ["order", "orders", "payment"],
  evidence: "MP docs: Orders API notifications use topic orders; payment is legacy Checkout API",
};

fs.writeFileSync(
  path.join(process.cwd(), "scripts/_tmp-fase-3-3-mp-app-audit-result.json"),
  JSON.stringify(report, null, 2)
);
console.log(JSON.stringify(report, null, 2));
