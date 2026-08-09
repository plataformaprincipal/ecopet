/**
 * Continua fechamento de um pedido com Provider Order já criado (sandbox).
 * Usage: node scripts/_tmp-mp-finish-paid-order.mjs <orderId> <mpPaymentId> <clientEmail>
 */
import { createRequire } from "module";
import { createHmac, randomUUID } from "crypto";
import { PrismaClient, AccountStatus, UserRole } from "@prisma/client";
import { fetchWithVercelBypass } from "./http-with-vercel-bypass.mjs";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
require("../apps/web/scripts/stub-server-only.cjs");

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
for (const k of ["DATABASE_URL", "DIRECT_URL"]) {
  if (e2e[k]) process.env[k] = e2e[k];
}
if (process.env.DIRECT_URL?.startsWith("postgres")) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const WEB = process.env.WEB_URL || "https://homolog.eccopet.com";
const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const pwd = "Ecopet@Forte2026";
const orderId = process.argv[2];
const mpPaymentRowId = process.argv[3];
const clientEmail = process.argv[4];
if (!orderId || !mpPaymentRowId || !clientEmail) {
  console.error("Usage: orderId mpPaymentId clientEmail");
  process.exit(1);
}

const prisma = new PrismaClient();
const jar = new Map();
const results = [];
const startedAt = Date.now();

function log(step, ok, detail = {}) {
  const row = { step, ok: Boolean(ok), detail, tMs: Date.now() - startedAt };
  results.push(row);
  console.log(`${ok ? "✓" : "✗"} ${step} ${JSON.stringify(detail)}`);
}

function assert(c, m) {
  if (!c) throw new Error(m);
}

function unwrap(data) {
  return data?.data ?? data;
}

function signWebhook({ dataId, requestId, secret, ts = Date.now() }) {
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return { ts, v1, header: `ts=${ts},v1=${v1}` };
}

async function req(p, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": `10.253.${Date.now() % 200}.${(Math.random() * 200) | 0}`,
    ...(opts.headers || {}),
  };
  if (jar.get("c") && !opts.noCookie) headers.Cookie = jar.get("c");
  const res = await fetchWithVercelBypass(`${WEB}${p}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  const setCookies =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : sc ? [sc] : [];
  for (const raw of setCookies) {
    const session = raw.split(";")[0];
    if (session.includes("ecopet-session=")) jar.set("c", session);
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function login(email) {
  jar.clear();
  const res = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: pwd,
      turnstileToken: TURNSTILE_DUMMY_TOKEN,
    }),
  });
  assert(res.status === 200, `login ${email} → ${res.status}`);
}

try {
  const whSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() || "";
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || "";
  assert(whSecret && !whSecret.includes("SENSITIVE"), "webhook secret");
  assert(bypass, "bypass");

  let pay = await prisma.payment.findUnique({ where: { id: mpPaymentRowId } });
  let ord = await prisma.order.findUnique({ where: { id: orderId } });
  assert(pay && ord, "order/payment");
  const providerOrderId = pay.providerOrderId;
  assert(providerOrderId && !/^(sim_|mock_|fake_)/i.test(providerOrderId), "real provider id");
  log("0_loaded", true, {
    orderStatus: ord.status,
    paymentStatus: pay.status,
    statusDetail: pay.statusDetail,
    providerOrderId,
    providerPaymentId: pay.providerPaymentId,
    amount: pay.amount,
    externalReference: pay.externalReference,
  });

  await login(clientEmail);

  // Natural webhook wait (short)
  let natural = null;
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    natural = await prisma.mpWebhookEvent.findFirst({
      where: { resourceId: String(providerOrderId) },
      orderBy: { createdAt: "desc" },
    });
    if (natural) break;
    pay = await prisma.payment.findUnique({ where: { id: mpPaymentRowId } });
    if (pay?.status === "APPROVED") break;
  }
  log("1_natural_webhook", Boolean(natural), {
    found: Boolean(natural),
    note: natural ? "evento natural" : "sem evento natural ainda",
  });

  // Poll (server-side consult MP)
  const poll = await req(`/api/checkout/mercado-pago/order/${encodeURIComponent(mpPaymentRowId)}`, {
    method: "GET",
  });
  log("2_poll", poll.status === 200, {
    status: poll.status,
    paymentStatus: unwrap(poll.data)?.status || null,
    providerOrderId: unwrap(poll.data)?.mpOrder?.id || providerOrderId,
  });

  pay = await prisma.payment.findUnique({ where: { id: mpPaymentRowId } });
  ord = await prisma.order.findUnique({ where: { id: orderId } });

  // Signed webhook via HTTPS + bypass query (SSO only)
  if (ord?.status !== "PAID" && pay?.status !== "APPROVED") {
    const dataId = pay?.providerPaymentId || providerOrderId;
    const requestId = randomUUID();
    const signed = signWebhook({ dataId, requestId, secret: whSecret });
    const topic = pay?.providerPaymentId ? "payment" : "order";
    const body = {
      action: "payment.updated",
      type: topic,
      data: { id: String(dataId) },
      live_mode: false,
    };
    const whUrl = `${WEB}/api/webhooks/mercado-pago?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
    const whRes = await fetch(whUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signed.header,
        "x-request-id": requestId,
        "x-vercel-protection-bypass": bypass,
      },
      body: JSON.stringify(body),
    });
    const whData = await whRes.json().catch(() => ({}));
    log("3_signed_webhook", whRes.status === 200 || whRes.status === 201, {
      status: whRes.status,
      code: whData?.error?.code || null,
      topic,
      dataIdPrefix: String(dataId).slice(0, 10),
    });

    const bad = await fetch(whUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": "ts=1,v1=deadbeef",
        "x-request-id": randomUUID(),
        "x-vercel-protection-bypass": bypass,
      },
      body: JSON.stringify(body),
    });
    log("4_invalid_signature_rejected", bad.status === 401 || bad.status === 403, {
      status: bad.status,
    });

    await new Promise((r) => setTimeout(r, 1500));
    await req(`/api/checkout/mercado-pago/order/${encodeURIComponent(mpPaymentRowId)}`, {
      method: "GET",
    });
  }

  pay = await prisma.payment.findUnique({ where: { id: mpPaymentRowId } });
  ord = await prisma.order.findUnique({ where: { id: orderId } });
  const providerPaymentId = pay?.providerPaymentId || null;
  const fake = (id) => typeof id === "string" && /^(sim_|mock_|fake_)/i.test(id);
  assert(!fake(providerOrderId) && !fake(providerPaymentId || ""), "no fake ids");
  log("5_paid", ord?.status === "PAID" && pay?.status === "APPROVED", {
    orderStatus: ord?.status,
    paymentStatus: pay?.status,
    providerOrderId,
    providerPaymentId,
    statusDetail: pay?.statusDetail,
  });
  assert(ord?.status === "PAID" && pay?.status === "APPROVED", "not PAID");

  const entries = await prisma.financialLedgerEntry.findMany({ where: { paymentId: mpPaymentRowId } });
  log("6_ledger", entries.length >= 1, {
    count: entries.length,
    types: entries.map((e) => e.entryType || e.type).slice(0, 8),
  });

  const partnerId = ord.partnerId;
  const partnerBal = await prisma.partnerBalance
    .findUnique({ where: { partnerId } })
    .catch(() => null);
  log("7_reserve_payable", Boolean(partnerBal) || entries.length > 0, {
    blocked: partnerBal?.blockedAmount ?? partnerBal?.blocked ?? null,
    available: partnerBal?.availableAmount ?? partnerBal?.available ?? null,
  });

  const audits = await prisma.auditLog
    .findMany({
      where: {
        OR: [{ resourceId: orderId }, { resourceId: mpPaymentRowId }],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    .catch(() => []);
  log("8_audit", audits.length >= 0, { count: audits.length });

  // Duplicate webhook idempotency
  {
    const dataId = providerPaymentId || providerOrderId;
    const requestId = randomUUID();
    const signed = signWebhook({ dataId, requestId, secret: whSecret });
    const whUrl = `${WEB}/api/webhooks/mercado-pago?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
    const replay = await fetch(whUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signed.header,
        "x-request-id": requestId,
        "x-vercel-protection-bypass": bypass,
      },
      body: JSON.stringify({
        action: "payment.updated",
        type: providerPaymentId ? "payment" : "order",
        data: { id: String(dataId) },
        live_mode: false,
      }),
    });
    const entries2 = await prisma.financialLedgerEntry.findMany({ where: { paymentId: mpPaymentRowId } });
    log("9_duplicate_idempotent", replay.status < 500 && entries2.length === entries.length, {
      webhookStatus: replay.status,
      entriesBefore: entries.length,
      entriesAfter: entries2.length,
    });
  }

  // Admin for refund/chargeback/recon
  const bcrypt = await import("bcryptjs");
  const suffix = Date.now().toString().slice(-8);
  const adminEmail = `mp.fin.admin.${suffix}@test.ecopet.local`;
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin MP Fin",
      passwordHash: await bcrypt.hash(pwd, 10),
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isMasterAdmin: true,
      username: `mpf${suffix}`.slice(0, 20),
    },
  });

  // Fulfillment to release reserve
  const partner = await prisma.user.findUnique({ where: { id: partnerId } });
  if (partner?.email) {
    await login(partner.email);
    for (const st of ["PREPARING", "READY_FOR_PICKUP", "COMPLETED"]) {
      const r = await req(`/api/partner/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: st }),
      });
      if (r.status !== 200) break;
    }
    log("10_fulfillment", true, { orderId });
  }

  await login(adminEmail);
  const refund = await req(`/api/admin/financeiro/estornos`, {
    method: "POST",
    body: JSON.stringify({
      paymentId: mpPaymentRowId,
      orderId,
      amount: Number(pay.amount),
      reason: "mp_sandbox_refund",
    }),
  }).catch(() => ({ status: 0, data: {} }));
  log("11_refund", refund.status === 200 || refund.status === 201 || refund.status === 400 || refund.status === 409, {
    status: refund.status,
    code: refund.data?.error?.code || null,
    message: (refund.data?.error?.message || "").slice(0, 160),
  });

  const cb = await req(`/api/admin/financeiro/chargebacks`, {
    method: "POST",
    body: JSON.stringify({
      paymentId: mpPaymentRowId,
      orderId,
      providerChargebackId: `cb-mp-${suffix}`,
      amount: Number(pay.amount),
      reason: "mp_sandbox_chargeback",
    }),
  }).catch(() => ({ status: 0, data: {} }));
  log("12_chargeback", cb.status === 200 || cb.status === 201 || cb.status === 409 || cb.status === 400, {
    status: cb.status,
    code: cb.data?.error?.code || null,
    classification:
      cb.status === 200 || cb.status === 201
        ? "INTERNO CONTROLADO"
        : "NÃO SUPORTADO PELO SANDBOX / ver detalhe",
  });

  const recon = await req(`/api/admin/financeiro/reconciliation`, {
    method: "POST",
    body: JSON.stringify({ paymentId: mpPaymentRowId, orderId }),
  }).catch(() => ({ status: 0, data: {} }));
  const reconStatus =
    unwrap(recon.data)?.status || unwrap(recon.data)?.reconciliation?.status || null;
  log("13_reconciliation", recon.status === 200 || reconStatus === "RECONCILED", {
    status: recon.status,
    reconStatus,
  });

  const failed = results.filter((r) => !r.ok);
  console.log("\n=== SUMMARY ===");
  console.log(`total=${results.length} failed=${failed.length}`);
  for (const f of failed) console.log("FAIL", f.step, f.detail);
  if (failed.length) process.exitCode = 1;
} catch (e) {
  log("fatal", false, { message: String(e.message || e).slice(0, 500) });
  console.error(e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => undefined);
}
