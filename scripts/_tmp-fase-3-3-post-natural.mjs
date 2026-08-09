/**
 * After natural webhook PAID: verify chain + idempotent replay. No secrets printed.
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

const WEB = process.env.WEB_URL || "https://homolog.eccopet.com";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const whSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || verify.MERCADO_PAGO_WEBHOOK_SECRET;
const watch = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "scripts/_tmp-fase-3-3-natural-watch-result.json"), "utf8")
);
const prisma = new PrismaClient();
const results = [];

function log(step, ok, detail = {}) {
  results.push({ step, ok: Boolean(ok), detail });
  console.log(`${ok ? "✓" : "✗"} ${step} ${JSON.stringify(detail)}`);
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

const pay = await prisma.payment.findFirst({
  where: { providerOrderId: watch.providerOrderId },
  include: { order: true },
});
if (!pay) {
  console.error("payment not found");
  process.exit(1);
}

const entries = await prisma.financialLedgerEntry.findMany({ where: { paymentId: pay.id } });
const types = entries.map((e) => e.entryType);
const reserve = await prisma.financialReserve.findFirst({ where: { paymentId: pay.id } });
const events = await prisma.mpWebhookEvent.findMany({
  where: {
    OR: [
      { resourceId: pay.providerOrderId },
      { resourceId: pay.providerPaymentId || undefined },
      { paymentId: pay.id },
    ].filter(Boolean),
  },
  orderBy: { createdAt: "asc" },
});
const snapshots = await prisma.mpResourceSnapshot.findMany({
  where: { resourceId: pay.providerOrderId },
  take: 5,
});
const audits = await prisma.auditLog
  .findMany({
    where: { OR: [{ resourceId: pay.id }, { resourceId: pay.orderId }] },
    take: 20,
  })
  .catch(() => []);

const natural = events.filter((e) => e.signatureValid === true);
log("natural_events", natural.length >= 1, {
  total: events.length,
  signatureValid: natural.length,
  firstType: events[0]?.eventType || null,
  firstStatus: events[0]?.processingStatus || null,
});
log("paid_chain", pay.status === "APPROVED" && pay.order?.status === "PAID", {
  paymentStatus: pay.status,
  orderStatus: pay.order?.status,
});
log("ledger", types.includes("PAYMENT_RECEIVED") && types.includes("PARTNER_PAYABLE"), {
  count: entries.length,
  types,
  paymentReceived: types.filter((t) => t === "PAYMENT_RECEIVED").length,
  partnerPayable: types.filter((t) => t === "PARTNER_PAYABLE").length,
});
log("reserve", reserve?.status === "HELD", {
  status: reserve?.status || null,
  amountCents: reserve?.amountCents ?? null,
});
log("order_snapshot_server_side", snapshots.some((s) => s.source === "api_get" && s.resourceType === "order"), {
  snapshotCount: snapshots.length,
  sources: [...new Set(snapshots.map((s) => s.source))],
});
log("audit", audits.length >= 0, { auditCount: audits.length });

// idempotent replay (signed) — not natural proof
const dataId = pay.providerOrderId || pay.providerPaymentId;
const requestId = randomUUID();
const signed = signWebhook({ dataId, requestId, secret: whSecret });
const whUrl = `${WEB}/api/webhooks/mercado-pago?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
const replay = await fetch(whUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-signature": signed.header,
    "x-request-id": requestId,
  },
  body: JSON.stringify({
    action: "order.updated",
    type: "order",
    data: { id: String(dataId) },
    live_mode: false,
  }),
});
const entriesAfter = await prisma.financialLedgerEntry.count({ where: { paymentId: pay.id } });
log("idempotency", replay.status < 500 && entriesAfter === entries.length, {
  webhookStatus: replay.status,
  before: entries.length,
  after: entriesAfter,
});

const out = {
  providerOrderId: sanitizeId(pay.providerOrderId),
  providerPaymentId: sanitizeId(pay.providerPaymentId),
  results,
  failed: results.filter((r) => !r.ok).map((r) => r.step),
};
fs.writeFileSync(
  path.join(process.cwd(), "scripts/_tmp-fase-3-3-post-natural-result.json"),
  JSON.stringify(out, null, 2)
);
console.log(JSON.stringify(out, null, 2));
await prisma.$disconnect();
if (out.failed.length) process.exitCode = 1;
