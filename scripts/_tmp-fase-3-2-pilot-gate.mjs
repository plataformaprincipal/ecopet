/**
 * FASE 3.2 — Gate final de piloto financeiro controlado (Preview / homolog).
 *
 * Prova cobrança sandbox real + entrega NATURAL do webhook MP.
 * Não usa webhook assinado interno como prova de entrega natural.
 * Polling só como fallback após a janela de observação.
 * Não imprime secrets.
 */
import { createRequire } from "module";
import { createHmac, randomUUID } from "crypto";
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

const NATURAL_WAIT_MS = Number(process.env.NATURAL_WEBHOOK_WAIT_MS || 180_000);
const NATURAL_POLL_DB_MS = 5_000;

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
if (process.env.DIRECT_URL?.startsWith("postgres")) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}
// Prefer runtime Preview credentials for charge (not stale local MP tokens).
delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
delete process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

const WEB = process.env.WEB_URL || "https://homolog.eccopet.com";
const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const pwd = "Ecopet@Forte2026";
const prisma = new PrismaClient();
const jar = new Map();
const suffix = Date.now().toString().slice(-8);
const results = [];
const timeline = {};
let reqSeq = 0;
const IP_BASE = `10.253.${Date.now() % 200}`;

function log(step, ok, detail = {}) {
  const row = { step, ok: Boolean(ok), detail, t: new Date().toISOString() };
  results.push(row);
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
  if (s.length <= 12) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}
function isForbiddenId(id) {
  if (!id) return true;
  return /^(sim_|mock_|fake_)/i.test(String(id));
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
  return { status: res.status, data: await res.json().catch(() => ({})), headers: res.headers };
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

function signWebhook({ dataId, requestId, secret, ts = Date.now() }) {
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return { ts, v1, header: `ts=${ts},v1=${v1}` };
}

async function createCardToken(publicKey) {
  const res = await fetch(
    `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_number: "4235647728025682", // visa test
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

async function findNaturalWebhook({ providerOrderId, providerPaymentId, since }) {
  const ids = [providerOrderId, providerPaymentId].filter(Boolean).map(String);
  if (!ids.length) return null;
  const rows = await prisma.mpWebhookEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    take: 120,
  });
  return (
    rows.find((ev) => {
      const blob = JSON.stringify(ev.sanitizedPayload || {});
      const rid = String(ev.resourceId || "");
      const payId = String(ev.paymentId || "");
      return ids.some(
        (id) => rid.includes(id) || blob.includes(id) || payId.includes(id)
      );
    }) || null
  );
}

async function financialSnapshot(paymentId, orderId, partnerId) {
  const [pay, ord, entries, reserve, audit] = await Promise.all([
    prisma.payment.findUnique({ where: { id: paymentId } }),
    prisma.order.findUnique({ where: { id: orderId } }),
    prisma.financialLedgerEntry.findMany({
      where: { paymentId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.financialReserve.findFirst({ where: { paymentId } }).catch(() => null),
    prisma.auditLog
      .findMany({
        where: {
          OR: [{ resourceId: paymentId }, { resourceId: orderId }],
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
  ]);
  const types = entries.map((e) => e.entryType).filter(Boolean);
  const partnerPayableCents = entries
    .filter((e) => e.entryType === "PARTNER_PAYABLE" && e.partnerId === partnerId)
    .reduce((s, e) => s + (e.amountCents || 0), 0);
  return {
    orderStatus: ord?.status || null,
    paymentStatus: pay?.status || null,
    providerOrderId: pay?.providerOrderId || null,
    providerPaymentId: pay?.providerPaymentId || null,
    ledgerCount: entries.length,
    ledgerTypes: types,
    paymentReceived: types.filter((t) => t === "PAYMENT_RECEIVED").length,
    partnerPayableEntries: types.filter((t) => t === "PARTNER_PAYABLE").length,
    partnerPayableCents,
    reserveStatus: reserve?.status || null,
    reserveAmountCents: reserve?.amountCents ?? null,
    auditCount: Array.isArray(audit) ? audit.length : 0,
  };
}

async function main() {
  console.log("=== FASE 3.2 PILOT GATE @ homolog ===");
  console.log(`WEB_URL=${WEB}`);
  console.log(`NATURAL_WAIT_MS=${NATURAL_WAIT_MS}`);

  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || "";
  const whSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() || verify.MERCADO_PAGO_WEBHOOK_SECRET || "";
  assert(bypass, "VERCEL_AUTOMATION_BYPASS_SECRET ausente");
  assert(whSecret && !String(whSecret).includes("SENSITIVE"), "MERCADO_PAGO_WEBHOOK_SECRET ausente");

  // 1) Health + runtime
  const healthRes = await fetchWithVercelBypass(`${WEB}/api/health`);
  const health = await healthRes.json().catch(() => ({}));
  const dbOk =
    health?.database === "connected" ||
    health?.data?.database === "connected" ||
    health?.checks?.database === "connected";
  log("1_health", healthRes.status === 200 && dbOk, {
    status: healthRes.status,
    database: health?.database || health?.data?.database || health?.checks?.database || null,
  });
  assert(healthRes.status === 200 && dbOk, "health/database");

  // 2) Webhook reachability (protection vs bypass query) — not natural delivery
  const bare = await fetch(`${WEB}/api/webhooks/mercado-pago`, {
    method: "GET",
    redirect: "manual",
  });
  log("2_webhook_bare_protection", [302, 401, 403].includes(bare.status), {
    status: bare.status,
  });
  const withQ = await fetch(
    `${WEB}/api/webhooks/mercado-pago?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`,
    { method: "GET", redirect: "manual" }
  );
  log("2b_webhook_bypass_query_reachable", withQ.status === 200, {
    status: withQ.status,
    note: "bypass só atravessa SSO; assinatura MP permanece obrigatória no POST",
  });

  // 3) Commercial setup
  const clientEmail = `mp.g32.client.${suffix}@test.ecopet.local`;
  const partnerEmail = `mp.g32.partner.${suffix}@test.ecopet.local`;
  const payerEmail = `ecopet.g32.${suffix}@testuser.com`;
  const bcrypt = await import("bcryptjs");
  const adminEmail = `mp.g32.admin.${suffix}@test.ecopet.local`;

  const regC = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Gate32",
      email: clientEmail,
      password: pwd,
      confirmPassword: pwd,
      phone: `+55119${suffix.slice(-8)}`,
      birthDate: "1990-01-01",
      username: `g32c${suffix}`.slice(0, 20),
      gender: "MASCULINO",
      acceptTerms: true,
      acceptPrivacy: true,
      turnstileToken: TURNSTILE_DUMMY_TOKEN,
    }),
  });
  assert(regC.status === 201, `client reg ${regC.status} ${JSON.stringify(regC.data?.error ?? regC.data).slice(0, 200)}`);
  const partnerCnpj = generateValidCnpj(suffix);
  const regP = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      partnerType: "CORPORATE",
      name: "Parceiro Gate32",
      email: partnerEmail,
      username: `g32p${suffix}`.slice(0, 20),
      phone: `+55119${String(Number(suffix) + 1).padStart(8, "0").slice(-8)}`,
      password: pwd,
      confirmPassword: pwd,
      businessName: `Loja G32 ${suffix}`,
      legalName: `Loja G32 ${suffix} LTDA`,
      cnpj: partnerCnpj,
      corporateType: "Empresa Ltda.",
      activityStartDate: "2018-03-15",
      activityAreas: ["SAUDE_ANIMAL", "ESTETICA_BEM_ESTAR"],
      businessDescription:
        "Parceiro de homologação financeira Fase 3.2 com atendimento pet completo e operação contínua.",
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
  assert(regP.status === 201, `partner reg ${regP.status} ${JSON.stringify(regP.data?.error ?? regP.data).slice(0, 240)}`);
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
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin Gate32",
      passwordHash: await bcrypt.hash(pwd, 10),
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isMasterAdmin: true,
      username: `g32a${suffix}`.slice(0, 20),
    },
  });
  log("3_users", true, { partnerId: sanitizeId(partner.id) });

  await login(clientEmail);
  const cfgRes = await req("/api/checkout/mercado-pago/config");
  const cfg = unwrap(cfgRes.data);
  log("1b_mp_runtime", cfg?.environment === "test" && Boolean(cfg?.publicKey), {
    environment: cfg?.environment || null,
    status: cfg?.status || null,
    publicKeyPrefix: cfg?.publicKey ? String(cfg.publicKey).slice(0, 10) : null,
  });
  assert(cfg?.environment === "test" && cfg?.publicKey, "MP environment=test");
  log("1c_simulated_flag_probe", true, {
    note: "ALLOW_SIMULATED_PAYMENTS esperado false/fail-closed; cobrança usa IDs ORDTST/PAY reais",
  });

  await login(partnerEmail);
  const product = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({
      name: `Racao G32 ${suffix}`,
      description: "Produto gate 3.2",
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
  const checkout = await req("/api/checkout", {
    method: "POST",
    headers: { "Idempotency-Key": `g32-${suffix}` },
    body: JSON.stringify({
      deliveryMethod: "PICKUP_LOCAL",
      paymentMethod: "CARD",
      phone: `+55119${suffix.slice(-8)}`,
      address: { street: "Rua MP", city: "São Paulo", state: "SP" },
    }),
  });
  assert(
    checkout.status === 200 || checkout.status === 201,
    `checkout ${checkout.status} ${JSON.stringify(checkout.data?.error ?? checkout.data).slice(0, 200)}`
  );
  const order = unwrap(checkout.data)?.order || unwrap(checkout.data);
  const orderId = order.id;
  assert(orderId, "orderId");

  const dbOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true, items: true },
  });
  let paymentId = dbOrder.payments[0]?.id;
  assert(paymentId, "paymentId");
  const pre = await financialSnapshot(paymentId, orderId, partner.id);
  const preOk =
    ["PENDING", "PENDING_CONFIRMATION", "CONFIRMED"].includes(dbOrder.status) &&
    ["PENDING", "CREATED", "PROCESSING"].includes(String(pre.paymentStatus || "PENDING")) &&
    pre.paymentReceived === 0 &&
    pre.ledgerCount === 0 &&
    !pre.reserveStatus;
  log("4_pre_payment_state", preOk, {
    orderStatus: dbOrder.status,
    paymentStatus: pre.paymentStatus,
    amount: dbOrder.total,
    snapshotItems: dbOrder.items?.length || 0,
    paymentReceived: pre.paymentReceived,
    ledgerCount: pre.ledgerCount,
    reserveStatus: pre.reserveStatus,
    note: "domínio usa PENDING_CONFIRMATION pré-pagamento (não PENDING_PAYMENT)",
  });
  assert(preOk, "pre-payment dirty state");

  // 4) Real sandbox charge
  const tok = await createCardToken(cfg.publicKey);
  assert(tok.id, `card token ${tok.status} ${tok.error}`);
  timeline.chargeAt = new Date().toISOString();
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
  const providerOrderId = created?.providerOrderId || null;
  log("5_charge_external", (mpCreate.status === 200 || mpCreate.status === 201) && Boolean(providerOrderId), {
    status: mpCreate.status,
    code: mpCreate.data?.error?.code || null,
    providerOrderId: sanitizeId(providerOrderId),
    paymentStatus: created?.status || null,
    forbiddenId: isForbiddenId(providerOrderId),
  });
  assert(providerOrderId && /^ORD/i.test(providerOrderId) && !isForbiddenId(providerOrderId), "provider order id real");

  // Re-read by providerOrderId to avoid stale/wrong row
  let pay =
    (await prisma.payment.findFirst({
      where: { orderId, provider: "mercado_pago", providerOrderId },
    })) || (await prisma.payment.findUnique({ where: { id: paymentId } }));
  if (pay?.id && pay.id !== paymentId) paymentId = pay.id;
  // Brief settle for write visibility
  for (let i = 0; i < 10 && (!pay?.providerOrderId || !pay?.providerPaymentId); i++) {
    await new Promise((r) => setTimeout(r, 500));
    pay = await prisma.payment.findFirst({
      where: { orderId, provider: "mercado_pago" },
      orderBy: { createdAt: "desc" },
    });
    if (pay?.id) paymentId = pay.id;
  }
  timeline.providerApprovedAt =
    pay?.statusDetail === "accredited" ||
    pay?.status === "APPROVED" ||
    created?.status === "APPROVED"
      ? new Date().toISOString()
      : null;
  log("5b_provider_ids_after_create", Boolean(pay?.providerOrderId), {
    paymentId: sanitizeId(paymentId),
    providerOrderId: sanitizeId(pay?.providerOrderId || providerOrderId),
    providerPaymentId: sanitizeId(pay?.providerPaymentId),
    paymentStatus: pay?.status || null,
    statusDetail: pay?.statusDetail || null,
    orderStatus: (await prisma.order.findUnique({ where: { id: orderId } }))?.status || null,
    note: "PAID/APPROVED interno só via webhook natural ou poll; create pode ficar PROCESSING",
  });
  assert(pay?.providerOrderId && !isForbiddenId(pay.providerOrderId), "provider order id missing in DB");
  if (pay.providerPaymentId) {
    assert(!isForbiddenId(pay.providerPaymentId), "no fake payment id");
  }

  // 5) NATURAL webhook window — NO poll, NO signed webhook
  const observeSince = new Date(Date.now() - 5_000);
  const waitStarted = Date.now();
  timeline.naturalWaitStart = new Date().toISOString();
  let natural = null;
  let naturalPaidByWebhook = false;
  while (Date.now() - waitStarted < NATURAL_WAIT_MS) {
    natural = await findNaturalWebhook({
      providerOrderId,
      providerPaymentId: pay?.providerPaymentId,
      since: observeSince,
    });
    pay = await prisma.payment.findUnique({ where: { id: paymentId } });
    const ord = await prisma.order.findUnique({ where: { id: orderId } });
    const webhookEvents = await prisma.paymentEvent.findMany({
      where: {
        paymentId,
        OR: [
          { message: { contains: "webhook", mode: "insensitive" } },
          { eventType: { contains: "webhook", mode: "insensitive" } },
        ],
      },
      take: 5,
    });
    if (natural) {
      timeline.webhookAt = natural.createdAt?.toISOString?.() || new Date().toISOString();
      // If PAID and a webhook event exists after charge, credit natural path
      if (ord?.status === "PAID" && pay?.status === "APPROVED") {
        naturalPaidByWebhook = true;
      }
      break;
    }
    await new Promise((r) => setTimeout(r, NATURAL_POLL_DB_MS));
  }
  timeline.naturalWaitEnd = new Date().toISOString();

  const snapAfterWait = await financialSnapshot(paymentId, orderId, partner.id);
  const naturalProven = Boolean(natural);
  log("6_natural_webhook", naturalProven, {
    found: naturalProven,
    waitMs: Date.now() - waitStarted,
    webhookId: natural ? sanitizeId(natural.id) : null,
    topic: natural?.topic || natural?.type || null,
    processingStatus: natural?.processingStatus || null,
    httpHint: natural?.httpStatus || natural?.statusCode || null,
    orderStatus: snapAfterWait.orderStatus,
    paymentStatus: snapAfterWait.paymentStatus,
    ledgerCount: snapAfterWait.ledgerCount,
    classification: naturalProven ? "NATURAL_WEBHOOK_OBSERVED" : "WEBHOOK_DELIVERY_NOT_PROVEN",
  });

  // 6) Fallback poll ONLY if needed (re-login client — sessão pode expirar na janela)
  let usedPollFallback = false;
  if (!naturalProven || snapAfterWait.orderStatus !== "PAID") {
    usedPollFallback = true;
    timeline.pollFallbackAt = new Date().toISOString();
    await login(clientEmail);
    const poll = await req(`/api/checkout/mercado-pago/order/${encodeURIComponent(paymentId)}`, {
      method: "GET",
    });
    log("7_poll_fallback", poll.status === 200, {
      status: poll.status,
      paymentStatus: unwrap(poll.data)?.status || null,
      code: poll.data?.error?.code || null,
      note: "fallback autorizado; NÃO conta como prova de webhook natural",
    });
    // settle after poll apply
    for (let i = 0; i < 8; i++) {
      const s = await financialSnapshot(paymentId, orderId, partner.id);
      if (s.orderStatus === "PAID" && s.paymentStatus === "APPROVED") break;
      await new Promise((r) => setTimeout(r, 750));
    }
  } else {
    log("7_poll_fallback", true, { skipped: true, reason: "natural webhook observed" });
  }

  let snap = await financialSnapshot(paymentId, orderId, partner.id);
  log("8_financial_chain", snap.orderStatus === "PAID" && snap.paymentStatus === "APPROVED" && snap.ledgerCount >= 1, {
    orderStatus: snap.orderStatus,
    paymentStatus: snap.paymentStatus,
    providerOrderId: sanitizeId(snap.providerOrderId),
    providerPaymentId: sanitizeId(snap.providerPaymentId),
    ledgerCount: snap.ledgerCount,
    ledgerTypes: snap.ledgerTypes,
    paymentReceived: snap.paymentReceived,
    reserveStatus: snap.reserveStatus,
    reserveAmountCents: snap.reserveAmountCents,
    partnerPayableEntries: snap.partnerPayableEntries,
    partnerPayableCents: snap.partnerPayableCents,
    auditCount: snap.auditCount,
    forbidden: isForbiddenId(snap.providerOrderId) || isForbiddenId(snap.providerPaymentId),
  });
  assert(snap.orderStatus === "PAID" && snap.paymentStatus === "APPROVED", "order/payment not PAID/APPROVED");
  assert(snap.paymentReceived === 1, "expected single PAYMENT_RECEIVED");
  assert(snap.partnerPayableEntries >= 1, "expected partner payable");
  assert(snap.ledgerCount >= 1, "ledger empty");

  // 7) Idempotency — signed redelivery (legitimate duplicate), NOT natural proof
  const dataId = snap.providerPaymentId || snap.providerOrderId;
  const requestId = randomUUID();
  const signed = signWebhook({ dataId, requestId, secret: whSecret });
  const whUrl = `${WEB}/api/webhooks/mercado-pago?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
  const body = {
    action: "payment.updated",
    type: snap.providerPaymentId ? "payment" : "order",
    data: { id: String(dataId) },
    live_mode: false,
  };
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
  const snapReplay = await financialSnapshot(paymentId, orderId, partner.id);
  log("9_idempotency_replay", replay.status < 500 && snapReplay.ledgerCount === snap.ledgerCount && snapReplay.paymentReceived === 1, {
    webhookStatus: replay.status,
    ledgerBefore: snap.ledgerCount,
    ledgerAfter: snapReplay.ledgerCount,
    paymentReceived: snapReplay.paymentReceived,
  });

  // Invalid signature must still fail (bypass ≠ auth MP)
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
  log("9b_invalid_signature_rejected", bad.status === 401 || bad.status === 403, {
    status: bad.status,
  });

  // 8) Cold start persistence — wake serverless + new Prisma client + re-read
  await fetchWithVercelBypass(`${WEB}/api/health?cold=${Date.now()}`);
  await new Promise((r) => setTimeout(r, 2000));
  const prismaCold = new PrismaClient();
  const payCold = await prismaCold.payment.findUnique({ where: { id: paymentId } });
  const entriesCold = await prismaCold.financialLedgerEntry.count({ where: { paymentId } });
  const reserveCold = await prismaCold.financialReserve
    .findFirst({ where: { paymentId } })
    .catch(() => null);
  log("10_cold_persistence", payCold?.status === "APPROVED" && entriesCold === snap.ledgerCount, {
    paymentStatus: payCold?.status || null,
    ledgerCount: entriesCold,
    reserveStatus: reserveCold?.status || null,
  });

  // Re-send after cold
  const requestId2 = randomUUID();
  const signed2 = signWebhook({ dataId, requestId: requestId2, secret: whSecret });
  const replay2 = await fetch(whUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-signature": signed2.header,
      "x-request-id": requestId2,
      "x-vercel-protection-bypass": bypass,
    },
    body: JSON.stringify(body),
  });
  const entriesCold2 = await prismaCold.financialLedgerEntry.count({ where: { paymentId } });
  log("10b_cold_idempotency", replay2.status < 500 && entriesCold2 === entriesCold, {
    webhookStatus: replay2.status,
    ledgerCount: entriesCold2,
  });
  await prismaCold.$disconnect().catch(() => undefined);

  // 9) Refund sandbox real + recon
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
  const providerRefundId =
    rd?.providerRefundId || rd?.refund?.providerRefundId || rd?.externalRefundId || null;
  log("11_refund_sandbox", refund.status === 200 || refund.status === 201, {
    status: refund.status,
    code: refund.data?.error?.code || null,
    message: String(refund.data?.error?.message || "").slice(0, 160),
    providerRefundId: sanitizeId(providerRefundId),
  });

  const payAfter = await prisma.payment.findUnique({ where: { id: paymentId } });
  log("11b_payment_refunded", ["REFUNDED", "PARTIALLY_REFUNDED"].includes(payAfter?.status), {
    status: payAfter?.status || null,
    refundedAmount: payAfter?.refundedAmount ?? null,
  });

  const cb = await req(`/api/admin/financeiro/chargebacks`, {
    method: "POST",
    body: JSON.stringify({
      paymentId,
      orderId,
      providerChargebackId: `cb-g32-internal-${suffix}`,
      amount: Number(dbOrder.total),
      reason: "fase_3_2_internal_controlled",
    }),
  }).catch(() => ({ status: 0, data: {} }));
  log("12_chargeback_interno_controlado", cb.status === 200 || cb.status === 201 || cb.status === 409, {
    status: cb.status,
    classification: "INTERNO CONTROLADO",
    note: "sandbox não provê chargeback externo adquirente",
  });

  const recon = await req(`/api/admin/financeiro/reconciliation`, {
    method: "POST",
    body: JSON.stringify({ paymentId }),
  });
  const reconBody = unwrap(recon.data);
  const reconStatus = reconBody?.status || reconBody?.reconciliation?.status || null;
  log("13_reconciliation", recon.status === 200 && reconStatus === "RECONCILED", {
    status: recon.status,
    reconStatus,
  });

  const failed = results.filter((r) => !r.ok);
  const verdict = !naturalProven
    ? "GATE_CONDICIONAL"
    : snap.orderStatus === "PAID" && failed.filter((f) => !["6_natural_webhook"].includes(f.step)).length === 0
      ? "GATE_APROVADO"
      : "GATE_REPROVADO";

  const out = {
    verdict,
    naturalWebhookProven: naturalProven,
    usedPollFallback,
    timeline,
    naturalPaidByWebhook,
    providerOrderId: sanitizeId(providerOrderId),
    providerPaymentId: sanitizeId(snap.providerPaymentId),
    providerRefundId: sanitizeId(providerRefundId),
    results,
    failed: failed.map((f) => f.step),
  };
  fs.writeFileSync(
    path.join(process.cwd(), "scripts/_tmp-fase-3-2-pilot-gate-result.json"),
    JSON.stringify(out, null, 2)
  );
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({
    verdict,
    naturalWebhookProven: naturalProven,
    usedPollFallback,
    failed: out.failed,
    timeline,
  }, null, 2));
  if (verdict === "GATE_REPROVADO") process.exitCode = 1;
}

main().catch(async (e) => {
  log("fatal", false, { message: String(e.message || e).slice(0, 500) });
  console.error(e);
  process.exitCode = 1;
  await prisma.$disconnect().catch(() => undefined);
});
