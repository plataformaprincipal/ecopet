/**
 * Resume FASE 3.2 on existing PROCESSING/accredited payment:
 * poll → PAID → idempotency → refund → recon → chargeback classification.
 * Does NOT claim natural webhook.
 */
import { createRequire } from "module";
import { createHmac, randomUUID } from "crypto";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";
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
for (const k of ["DATABASE_URL", "DIRECT_URL", "VERCEL_AUTOMATION_BYPASS_SECRET", "E2E_TEST_SECRET"]) {
  if (e2e[k]) process.env[k] = e2e[k];
}
if (process.env.DIRECT_URL?.startsWith("postgres")) process.env.DATABASE_URL = process.env.DIRECT_URL;
delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
delete process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

const WEB = process.env.WEB_URL || "https://homolog.eccopet.com";
const pwd = "Ecopet@Forte2026";
const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const whSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || verify.MERCADO_PAGO_WEBHOOK_SECRET;
const prisma = new PrismaClient();
const jar = new Map();
const results = [];
const suffix = Date.now().toString().slice(-8);

function log(step, ok, detail = {}) {
  results.push({ step, ok: Boolean(ok), detail });
  console.log(`${ok ? "✓" : "✗"} ${step} ${JSON.stringify(detail)}`);
}
function assert(c, m) {
  if (!c) throw new Error(m);
}
function unwrap(d) {
  return d?.data ?? d;
}
function sanitizeId(id) {
  if (!id) return null;
  const s = String(id);
  return s.length <= 12 ? s : `${s.slice(0, 8)}…${s.slice(-4)}`;
}
function signWebhook({ dataId, requestId, secret, ts = Date.now() }) {
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return { header: `ts=${ts},v1=${v1}` };
}

async function req(p, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": `10.254.${Date.now() % 200}.${(Math.random() * 200) | 0}`,
    ...(opts.headers || {}),
  };
  if (jar.get("c")) headers.Cookie = jar.get("c");
  const res = await fetchWithVercelBypass(`${WEB}${p}`, { ...opts, headers });
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie")]
        : [];
  for (const raw of setCookies) {
    const session = String(raw).split(";")[0];
    if (session.includes("ecopet-session=")) jar.set("c", session);
  }
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function login(email) {
  jar.clear();
  const res = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: pwd, turnstileToken: TURNSTILE_DUMMY_TOKEN }),
  });
  assert(res.status === 200, `login ${res.status}`);
}

const pay = await prisma.payment.findFirst({
  where: {
    provider: "mercado_pago",
    status: "PROCESSING",
    providerOrderId: { startsWith: "ORDTST" },
    statusDetail: "accredited",
  },
  orderBy: { createdAt: "desc" },
  include: { order: true },
});
assert(pay, "no PROCESSING accredited payment");
const paymentId = pay.id;
const orderId = pay.orderId;
const client = await prisma.user.findUnique({ where: { id: pay.userId } });
assert(client?.email, "client email");

// Natural webhook check for this provider ids
const since = new Date(pay.createdAt.getTime() - 5000);
const whRows = await prisma.mpWebhookEvent.findMany({
  where: { createdAt: { gte: since } },
  orderBy: { createdAt: "asc" },
  take: 50,
});
const natural = whRows.find((ev) => {
  const blob = JSON.stringify(ev.sanitizedPayload || {});
  const rid = String(ev.resourceId || "");
  return (
    rid.includes(pay.providerOrderId) ||
    rid.includes(String(pay.providerPaymentId || "")) ||
    blob.includes(pay.providerOrderId) ||
    (pay.providerPaymentId && blob.includes(pay.providerPaymentId))
  );
});
log("natural_webhook", Boolean(natural), {
  found: Boolean(natural),
  classification: natural ? "NATURAL_WEBHOOK_OBSERVED" : "WEBHOOK_DELIVERY_NOT_PROVEN",
  providerOrderId: sanitizeId(pay.providerOrderId),
  providerPaymentId: sanitizeId(pay.providerPaymentId),
});

await login(client.email);
const poll = await req(`/api/checkout/mercado-pago/order/${encodeURIComponent(paymentId)}`, {
  method: "GET",
});
log("poll_fallback", poll.status === 200, {
  status: poll.status,
  paymentStatus: unwrap(poll.data)?.status || null,
  code: poll.data?.error?.code || null,
});

let updated = await prisma.payment.findUnique({ where: { id: paymentId } });
let ord = await prisma.order.findUnique({ where: { id: orderId } });
log("paid", ord?.status === "PAID" && updated?.status === "APPROVED", {
  orderStatus: ord?.status,
  paymentStatus: updated?.status,
});

const entries = await prisma.financialLedgerEntry.findMany({ where: { paymentId } });
const types = entries.map((e) => e.entryType);
const reserve = await prisma.financialReserve.findFirst({ where: { paymentId } });
log("ledger", entries.length >= 1 && types.includes("PAYMENT_RECEIVED"), {
  count: entries.length,
  types,
  paymentReceived: types.filter((t) => t === "PAYMENT_RECEIVED").length,
  partnerPayable: types.filter((t) => t === "PARTNER_PAYABLE").length,
  reserveStatus: reserve?.status || null,
  reserveAmountCents: reserve?.amountCents ?? null,
});

const dataId = updated.providerPaymentId || updated.providerOrderId;
const whUrl = `${WEB}/api/webhooks/mercado-pago?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
const body = {
  action: "payment.updated",
  type: updated.providerPaymentId ? "payment" : "order",
  data: { id: String(dataId) },
  live_mode: false,
};
const requestId = randomUUID();
const signed = signWebhook({ dataId, requestId, secret: whSecret });
const replay = await fetch(whUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-signature": signed.header,
    "x-request-id": requestId,
    "x-vercel-protection-bypass": bypass,
  },
  body: JSON.stringify(body),
});
const entries2 = await prisma.financialLedgerEntry.count({ where: { paymentId } });
log("idempotency", replay.status < 500 && entries2 === entries.length, {
  webhookStatus: replay.status,
  before: entries.length,
  after: entries2,
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
log("invalid_signature", bad.status === 401 || bad.status === 403, { status: bad.status });

// cold
await fetchWithVercelBypass(`${WEB}/api/health?cold=${Date.now()}`);
const prisma2 = new PrismaClient();
const coldPay = await prisma2.payment.findUnique({ where: { id: paymentId } });
const coldCount = await prisma2.financialLedgerEntry.count({ where: { paymentId } });
log("cold_persistence", coldPay?.status === "APPROVED" && coldCount === entries.length, {
  paymentStatus: coldPay?.status,
  ledgerCount: coldCount,
});
await prisma2.$disconnect();

const bcrypt = await import("bcryptjs");
const adminEmail = `mp.g32.fin.${suffix}@test.ecopet.local`;
await prisma.user.create({
  data: {
    email: adminEmail,
    name: "Admin G32 Fin",
    passwordHash: await bcrypt.hash(pwd, 10),
    role: UserRole.ADMIN,
    accountStatus: AccountStatus.ACTIVE,
    isMasterAdmin: true,
    username: `g32f${suffix}`.slice(0, 20),
  },
});
await login(adminEmail);
const refund = await req(`/api/admin/financeiro/estornos`, {
  method: "POST",
  body: JSON.stringify({
    paymentId,
    full: true,
    reason: "fase_3_2_sandbox_refund",
    action: "execute",
  }),
});
const rd = unwrap(refund.data);
log("refund", refund.status === 200 || refund.status === 201, {
  status: refund.status,
  code: refund.data?.error?.code || null,
  message: String(refund.data?.error?.message || "").slice(0, 160),
  providerRefundId: sanitizeId(rd?.providerRefundId || rd?.refund?.providerRefundId),
});
updated = await prisma.payment.findUnique({ where: { id: paymentId } });
log("refunded_status", ["REFUNDED", "PARTIALLY_REFUNDED"].includes(updated?.status), {
  status: updated?.status,
  refundedAmount: updated?.refundedAmount ?? null,
});

const cb = await req(`/api/admin/financeiro/chargebacks`, {
  method: "POST",
  body: JSON.stringify({
    paymentId,
    orderId,
    providerChargebackId: `cb-g32-internal-${suffix}`,
    amount: Number(pay.amount ?? pay.order?.total ?? 50),
    reason: "fase_3_2_internal_controlled",
  }),
});
log("chargeback_interno", cb.status === 200 || cb.status === 201 || cb.status === 409, {
  status: cb.status,
  classification: "INTERNO CONTROLADO",
});

const recon = await req(`/api/admin/financeiro/reconciliation`, {
  method: "POST",
  body: JSON.stringify({ paymentId }),
});
const reconBody = unwrap(recon.data);
const reconStatus = reconBody?.status || reconBody?.reconciliation?.status || null;
log("reconciliation", recon.status === 200 && reconStatus === "RECONCILED", {
  status: recon.status,
  reconStatus,
});

const failed = results.filter((r) => !r.ok);
const out = {
  naturalWebhookProven: Boolean(natural),
  usedPollFallback: true,
  providerOrderId: pay.providerOrderId,
  providerPaymentId: pay.providerPaymentId,
  results,
  failed: failed.map((f) => f.step),
};
fs.writeFileSync(
  path.join(process.cwd(), "scripts/_tmp-fase-3-2-finish-result.json"),
  JSON.stringify(out, null, 2)
);
console.log("\n=== SUMMARY ===");
console.log(JSON.stringify({ ...out, results: undefined }, null, 2));
if (failed.some((f) => f.step !== "natural_webhook")) process.exitCode = 1;
await prisma.$disconnect();
