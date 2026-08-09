/**
 * FASE 3.3 — Cobrança sandbox + observação de webhook NATURAL (até 10 min).
 * Sem polling. Sem webhook assinado. Não imprime secrets.
 */
import { createRequire } from "module";
import {
  PrismaClient,
  VerificationStatus,
  AccountStatus,
  UserRole,
} from "@prisma/client";
import { generateValidCnpj } from "./cnpj-test-utils.mjs";
import { fetchWithVercelBypass } from "./http-with-vercel-bypass.mjs";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
require("../apps/web/scripts/stub-server-only.cjs");

const NATURAL_WAIT_MS = Number(process.env.NATURAL_WEBHOOK_WAIT_MS || 1_320_000); // ~22m (retry MP ~15m)
const TICK_MS = 15_000;

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
const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const pwd = "Ecopet@Forte2026";
const prisma = new PrismaClient();
const jar = new Map();
const suffix = Date.now().toString().slice(-8);
let reqSeq = 0;
const IP_BASE = `10.256.${Date.now() % 200}`;

function log(step, detail = {}) {
  console.log(`${new Date().toISOString()} ${step} ${JSON.stringify(detail)}`);
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
function nextIp() {
  reqSeq += 1;
  return `${IP_BASE}.${(reqSeq % 200) + 1}`;
}

async function req(p, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": opts.testIp ?? nextIp(),
    ...(opts.headers || {}),
  };
  if (jar.get("c") && !opts.noCookie) headers.Cookie = jar.get("c");
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
    body: JSON.stringify({
      email,
      password: pwd,
      turnstileToken: TURNSTILE_DUMMY_TOKEN,
    }),
  });
  assert(res.status === 200, `login ${res.status}`);
}

async function createCardToken(publicKey) {
  const res = await fetch(
    `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_number: "4235647728025682",
        expiration_month: 11,
        expiration_year: 2030,
        security_code: "123",
        cardholder: {
          name: "APRO",
          identification: { type: "CPF", number: "12345678909" },
        },
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  return { status: res.status, id: data.id || null, error: data.message || data.error || null };
}

async function findNaturalWebhooks({ providerOrderId, providerPaymentId, since }) {
  const ids = [providerOrderId, providerPaymentId].filter(Boolean).map(String);
  const rows = await prisma.mpWebhookEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return rows.filter((ev) => {
    const blob = JSON.stringify(ev.sanitizedPayload || {});
    const rid = String(ev.resourceId || "");
    return ids.some((id) => rid.includes(id) || blob.includes(id));
  });
}

const timeline = {};
const clientEmail = `mp.g33.client.${suffix}@test.ecopet.local`;
const partnerEmail = `mp.g33.partner.${suffix}@test.ecopet.local`;
const payerEmail = `ecopet.g33.${suffix}@testuser.com`;

const regC = await req("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({
    role: "CLIENT",
    name: "Cliente Gate33",
    email: clientEmail,
    password: pwd,
    confirmPassword: pwd,
    phone: `+55119${suffix.slice(-8)}`,
    birthDate: "1990-01-01",
    username: `g33c${suffix}`.slice(0, 20),
    gender: "MASCULINO",
    acceptTerms: true,
    acceptPrivacy: true,
    turnstileToken: TURNSTILE_DUMMY_TOKEN,
  }),
});
assert(regC.status === 201, `client reg ${regC.status}`);

const partnerCnpj = generateValidCnpj(suffix);
const regP = await req("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({
    role: "PARTNER",
    partnerType: "CORPORATE",
    name: "Parceiro Gate33",
    email: partnerEmail,
    username: `g33p${suffix}`.slice(0, 20),
    phone: `+55119${String(Number(suffix) + 1).padStart(8, "0").slice(-8)}`,
    password: pwd,
    confirmPassword: pwd,
    businessName: `Loja G33 ${suffix}`,
    legalName: `Loja G33 ${suffix} LTDA`,
    cnpj: partnerCnpj,
    corporateType: "Empresa Ltda.",
    activityStartDate: "2018-03-15",
    activityAreas: ["SAUDE_ANIMAL", "ESTETICA_BEM_ESTAR"],
    businessDescription:
      "Parceiro de diagnóstico webhook Fase 3.3 com atendimento pet completo e operação contínua.",
    addressDetails: {
      zipCode: "01310-100",
      streetType: "Avenida",
      street: "Paulista",
      number: "1000",
      district: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
    operationDetails: {
      modes: ["BY_APPOINTMENT", "FIXED_HOURS"],
      weekdays: ["MON", "TUE", "WED"],
      openTime: "09:00",
      closeTime: "18:00",
      serviceRadius: "KM_10",
      deliveryOptions: ["HOME_SERVICE"],
    },
    financialDetails: {
      paymentMethods: ["Pix", "Cartão de crédito"],
      pixKeyType: "E-mail",
      pixKey: partnerEmail,
    },
    providedDocumentTypes: [
      "LEGAL_REP_ID",
      "RESIDENCE_PROOF",
      "CNPJ_CARD",
      "SOCIAL_CONTRACT",
    ],
    acceptTerms: true,
    acceptPrivacy: true,
    turnstileToken: TURNSTILE_DUMMY_TOKEN,
  }),
});
assert(regP.status === 201, `partner reg ${regP.status} ${JSON.stringify(regP.data?.error ?? {}).slice(0, 200)}`);

const partner = await prisma.user.findUnique({ where: { email: partnerEmail } });
assert(partner, "partner");
await prisma.user.update({
  where: { id: partner.id },
  data: { accountStatus: AccountStatus.ACTIVE },
});
await prisma.partnerProfile.update({
  where: { userId: partner.id },
  data: { verificationStatus: VerificationStatus.APPROVED, approvedAt: new Date() },
});

await login(clientEmail);
const cfg = unwrap((await req("/api/checkout/mercado-pago/config")).data);
assert(cfg?.environment === "test" && cfg?.publicKey, "mp config");
log("runtime_mp", {
  environment: cfg.environment,
  status: cfg.status,
  publicKeyPrefix: String(cfg.publicKey).slice(0, 10),
});

await login(partnerEmail);
const product = await req("/api/partner/products", {
  method: "POST",
  body: JSON.stringify({
    name: `Racao G33 ${suffix}`,
    description: "Diagnostico webhook",
    catalogCategory: "FOOD",
    price: 50,
    stock: 5,
    status: "ACTIVE",
  }),
});
const productId = unwrap(product.data)?.product?.id || unwrap(product.data)?.id;
assert(productId, "productId");

await login(clientEmail);
await req("/api/cart/items", {
  method: "POST",
  body: JSON.stringify({ productId, quantity: 1 }),
});
timeline.T0_orderCreatedAt = new Date().toISOString();
const checkout = await req("/api/checkout", {
  method: "POST",
  headers: { "Idempotency-Key": `g33-${suffix}` },
  body: JSON.stringify({
    deliveryMethod: "PICKUP_LOCAL",
    paymentMethod: "CARD",
    phone: `+55119${suffix.slice(-8)}`,
    address: { street: "Rua MP", city: "São Paulo", state: "SP" },
  }),
});
assert(checkout.status === 200 || checkout.status === 201, `checkout ${checkout.status}`);
const orderId = (unwrap(checkout.data)?.order || unwrap(checkout.data)).id;
const dbOrder = await prisma.order.findUnique({
  where: { id: orderId },
  include: { payments: true },
});
let paymentId = dbOrder.payments[0].id;
log("pre_payment", {
  orderStatus: dbOrder.status,
  paymentStatus: dbOrder.payments[0].status,
  amount: dbOrder.total,
});

const tok = await createCardToken(cfg.publicKey);
assert(tok.id, `card token ${tok.error}`);
timeline.T1_chargeAt = new Date().toISOString();
const mpCreate = await req("/api/checkout/mercado-pago/order", {
  method: "POST",
  body: JSON.stringify({
    orderId,
    paymentMethodId: "visa",
    paymentMethodType: "credit_card",
    cardToken: tok.id,
    installments: 1,
    payerEmail,
    payerFirstName: "APRO",
    payerLastName: "TEST",
    identificationType: "CPF",
    identificationNumber: "12345678909",
  }),
});
const created = unwrap(mpCreate.data);
const providerOrderId = created?.providerOrderId;
assert(providerOrderId && /^ORD/i.test(providerOrderId), `provider order ${mpCreate.status}`);

// settle DB
let pay = null;
for (let i = 0; i < 20; i++) {
  pay = await prisma.payment.findFirst({
    where: { orderId, provider: "mercado_pago", providerOrderId },
  });
  if (pay?.providerOrderId) break;
  await new Promise((r) => setTimeout(r, 400));
}
paymentId = pay?.id || paymentId;
if (pay?.statusDetail === "accredited" || pay?.providerPaymentId) {
  timeline.T2_providerApprovedAt = new Date().toISOString();
}
log("charge", {
  status: mpCreate.status,
  providerOrderId: sanitizeId(providerOrderId),
  providerPaymentId: sanitizeId(pay?.providerPaymentId),
  paymentStatus: pay?.status,
  statusDetail: pay?.statusDetail,
  apiStatus: created?.status,
});

const observeSince = new Date(Date.now() - 3000);
timeline.watchStart = new Date().toISOString();
const ticks = [];
let natural = [];
const started = Date.now();
while (Date.now() - started < NATURAL_WAIT_MS) {
  natural = await findNaturalWebhooks({
    providerOrderId,
    providerPaymentId: pay?.providerPaymentId,
    since: observeSince,
  });
  pay = await prisma.payment.findUnique({ where: { id: paymentId } });
  const ord = await prisma.order.findUnique({ where: { id: orderId } });
  const tick = {
    tMs: Date.now() - started,
    naturalCount: natural.length,
    orderStatus: ord?.status,
    paymentStatus: pay?.status,
    // NÃO aplicar poll — apenas leitura DB
  };
  ticks.push(tick);
  log("watch_tick", tick);
  if (natural.length) {
    timeline.firstNaturalAt = natural[0].createdAt?.toISOString?.() || new Date().toISOString();
    // Se assinatura OK, continuar observando DB (sem poll MP) até PAID ou +90s
    if (natural.some((ev) => ev.signatureValid)) {
      const paidDeadline = Date.now() + 90_000;
      while (Date.now() < paidDeadline) {
        pay = await prisma.payment.findUnique({ where: { id: paymentId } });
        const ordPaid = await prisma.order.findUnique({ where: { id: orderId } });
        const led = await prisma.financialLedgerEntry.count({ where: { paymentId } });
        if (ordPaid?.status === "PAID" && (pay?.status === "APPROVED" || pay?.status === "PAID") && led > 0) {
          break;
        }
        await new Promise((r) => setTimeout(r, TICK_MS));
      }
    }
    break;
  }
  await new Promise((r) => setTimeout(r, TICK_MS));
}
timeline.watchEnd = new Date().toISOString();

const finalPay = await prisma.payment.findUnique({ where: { id: paymentId } });
const finalOrd = await prisma.order.findUnique({ where: { id: orderId } });
const ledgerCount = await prisma.financialLedgerEntry.count({ where: { paymentId } });
const reserves = await prisma.financialReserve
  .findMany({ where: { orderId }, select: { id: true, status: true, paymentId: true } })
  .catch(() => []);
const reserveHeldCount = reserves.filter((r) => r.status === "HELD").length;
const partnerPayableEntries = await prisma.financialLedgerEntry.count({
  where: { paymentId, entryType: "PARTNER_PAYABLE" },
});
const auditCount = await prisma.auditLog
  .count({
    where: {
      OR: [{ resourceId: orderId }, { resourceId: paymentId }],
      createdAt: { gte: observeSince },
    },
  })
  .catch(() => 0);

function parseKv(s) {
  const out = {};
  for (const part of String(s || "").split(/\s+/)) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    out[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return out;
}

const naturalEvents = natural.map((ev) => {
  const kv = parseKv(ev.failureReason);
  const sig =
    ev.sanitizedPayload && typeof ev.sanitizedPayload === "object"
      ? ev.sanitizedPayload._sigDiag || null
      : null;
  return {
    id: sanitizeId(ev.id),
    eventType: ev.eventType,
    action: ev.action,
    resourceId: sanitizeId(ev.resourceId),
    processingStatus: ev.processingStatus,
    signatureValid: ev.signatureValid,
    failureCode: ev.failureCode,
    failureReason: ev.failureReason,
    createdAt: ev.createdAt,
    sigDiag: sig,
    parsed: {
      source: kv.source || sig?.source || null,
      rawQueryKeys: kv.rawQueryKeys || (sig?.rawQueryKeys || []).join(",") || null,
      queryDataDotId: kv.queryDataDotId || sig?.queryDataDotId || null,
      bodyDataId: kv.bodyDataId || sig?.bodyDataId || null,
      candidate: kv.candidate || sig?.candidateUsed || null,
      ts: kv.ts || sig?.ts || null,
      manifestSha8: kv.manifestSha8 || sig?.manifestSha8 || null,
      expHmacSha8: kv.expHmacSha8 || sig?.expectedHmacSha8 || null,
      recvHmacSha8: kv.recvHmacSha8 || sig?.receivedHmacSha8 || null,
      secretSha8: kv.secretSha8 || sig?.secretSha8 || null,
      dataIdSrc: kv.dataIdSrc || sig?.dataIdSource || null,
      reqSha8: kv.reqSha8 || sig?.xRequestIdSha8 || null,
    },
  };
});

const out = {
  naturalWebhookProven: natural.length > 0,
  classification: natural.length
    ? "NATURAL_WEBHOOK_OBSERVED"
    : "WEBHOOK_DELIVERY_NOT_PROVEN",
  waitMs: Date.now() - started,
  timeline,
  providerOrderId,
  providerPaymentId: finalPay?.providerPaymentId || null,
  providerOrderIdSanitized: sanitizeId(providerOrderId),
  providerPaymentIdSanitized: sanitizeId(finalPay?.providerPaymentId),
  externalReference: finalPay?.externalReference || finalOrd?.id || null,
  amount: finalPay?.amount ?? null,
  finalOrderStatus: finalOrd?.status,
  finalPaymentStatus: finalPay?.status,
  ledgerCount,
  reserveHeldCount,
  reserves: reserves.map((r) => ({ id: sanitizeId(r.id), status: r.status })),
  partnerPayableLedgerCount: partnerPayableEntries,
  auditCount,
  // financial chain without poll must stay unpaid if webhook missing
  paidWithoutPoll:
    finalOrd?.status === "PAID" &&
    (finalPay?.status === "APPROVED" || finalPay?.status === "PAID") &&
    ledgerCount > 0,
  naturalEvents,
  ticks,
  runtimePublicKeyPrefix: String(cfg.publicKey).slice(0, 10),
  note: "Nenhum polling e nenhum webhook assinado durante a janela",
};

fs.writeFileSync(
  path.join(process.cwd(), "scripts/_tmp-fase-3-3-natural-watch-result.json"),
  JSON.stringify(out, null, 2)
);
console.log("\n=== NATURAL WATCH SUMMARY ===");
console.log(JSON.stringify({ ...out, ticks: `[${ticks.length} ticks]` }, null, 2));
await prisma.$disconnect();
process.exitCode = 0;
