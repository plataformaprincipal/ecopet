/**
 * FASE 3.3 smoke: health + MP config + negative webhook probes (no secrets printed).
 */
import fs from "node:fs";
import path from "node:path";
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

const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
for (const [k, v] of Object.entries(e2e)) {
  if (!process.env[k]) process.env[k] = v;
}
for (const k of ["VERCEL_AUTOMATION_BYPASS_SECRET", "E2E_TEST_SECRET"]) {
  if (e2e[k]) process.env[k] = e2e[k];
}

const WEB = "https://homolog.eccopet.com";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || "";

const healthRes = await fetchWithVercelBypass(`${WEB}/api/health`);
const health = await healthRes.json().catch(() => ({}));

// clientless MP config may 401 — register temp not needed if we just hit webhook + health
const postBare = await fetch(`${WEB}/api/webhooks/mercado-pago`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "order", data: { id: "probe" } }),
});
const bareText = await postBare.text();

const postBad = await fetchWithVercelBypass(`${WEB}/api/webhooks/mercado-pago`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-signature": "ts=1,v1=deadbeef",
    "x-request-id": "smoke-bad-sig",
  },
  body: JSON.stringify({ type: "order", action: "order.processed", data: { id: "probe" } }),
});
const badJson = await postBad.json().catch(() => ({}));

console.log(
  JSON.stringify(
    {
      deploymentAlias: WEB,
      bypassPresent: Boolean(bypass),
      health: {
        status: healthRes.status,
        database: health.database || health.data?.database || null,
        ok: health.status || health.data?.status || null,
      },
      postBare: {
        status: postBare.status,
        vercelProtected: /Protected deployment/i.test(bareText),
        snippet: bareText.slice(0, 120),
      },
      postBypassInvalidSig: {
        status: postBad.status,
        code: badJson?.error?.code || null,
        eccopetReject: postBad.status === 401 && Boolean(badJson?.error?.code),
      },
    },
    null,
    2
  )
);
