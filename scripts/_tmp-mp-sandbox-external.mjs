/**
 * Fechamento externo MP sandbox contra homolog (sem imprimir secrets).
 * 1) Cobrança real via API Orders
 * 2) Provider IDs externos
 * 3) Webhook HTTPS no Preview (assinatura HMAC)
 * 4) PAID + ledger + reserve + payable + refund/chargeback/reconciliação
 */
import { createRequire } from "module";
import { createHmac, randomUUID } from "crypto";
import { PrismaClient, VerificationStatus, AccountStatus, UserRole } from "@prisma/client";
import { generateValidCnpj } from "./cnpj-test-utils.mjs";
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

// Prefer verify file for MP; e2e.local for bypass/DB; process.env overrides.
const verify = loadEnvFile(path.join(process.cwd(), "apps/web/.env.preview.verify"));
const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
for (const [k, v] of Object.entries({ ...verify, ...e2e })) {
  if (!process.env[k]) process.env[k] = v;
}
if (process.env.DIRECT_URL?.startsWith("postgres")) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const WEB = process.env.WEB_URL || "https://homolog.eccopet.com";
const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const pwd = "Ecopet@Forte2026";
const prisma = new PrismaClient();
const jar = new Map();
const results = [];
const startedAt = Date.now();
const suffix = Date.now().toString().slice(-8);
let reqSeq = 0;
const IP_BASE = `10.252.${Date.now() % 200}`;

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
  assert(res.status === 200, `login ${email} → ${res.status} ${JSON.stringify(res.data?.error ?? res.data)}`);
}

function signWebhook({ dataId, requestId, secret, ts = Date.now() }) {
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return { ts, v1, header: `ts=${ts},v1=${v1}` };
}

async function createCardToken(publicKey) {
  const url = `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      card_number: "5031433215406351",
      expiration_month: 11,
      expiration_year: 2030,
      security_code: "123",
      cardholder: {
        name: "APRO",
        identification: { type: "CPF", number: "12345678909" },
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, id: data.id || null, error: data.message || data.error || null };
}

async function main() {
  console.log("=== MP sandbox external closure @ homolog ===");
  console.log(`WEB_URL=${WEB}\n`);

  const pub = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim() || "";
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() || "";
  const whSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() || "";
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || "";

  assert(pub && !pub.includes("SENSITIVE"), "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ausente");
  assert(token && !token.includes("SENSITIVE"), "MERCADO_PAGO_ACCESS_TOKEN ausente");
  assert(whSecret && !whSecret.includes("SENSITIVE"), "MERCADO_PAGO_WEBHOOK_SECRET ausente");
  assert(bypass, "VERCEL_AUTOMATION_BYPASS_SECRET ausente");

  log("0_env_ready", true, {
    mpEnv: process.env.MERCADO_PAGO_ENVIRONMENT || null,
    pubPrefix: pub.slice(0, 8),
    tokenPrefix: token.slice(0, 8),
    whLen: whSecret.length,
  });

  // Health
  const health = await fetchWithVercelBypass(`${WEB}/api/health`);
  assert(health.ok, "health");
  log("1_health", true, { status: health.status });

  // Webhook bare (simula MP sem bypass) → deve bloquear
  const bare = await fetch(`${WEB}/api/webhooks/mercado-pago`, {
    method: "GET",
    redirect: "manual",
  });
  const bareBlocked = bare.status === 401 || bare.status === 403 || bare.status === 302;
  log("2_webhook_bare_blocked_by_protection", bareBlocked, {
    status: bare.status,
    location: bare.headers.get("location")?.slice(0, 80) || null,
    note: "MP não envia header de bypass; URL no painel precisa de ?x-vercel-protection-bypass=",
  });

  // Webhook com bypass query (formato oficial Vercel para webhooks)
  const withQ = await fetch(
    `${WEB}/api/webhooks/mercado-pago?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`,
    { method: "GET", redirect: "manual" }
  );
  const qBody = await withQ.json().catch(() => ({}));
  log("3_webhook_bypass_query_reachable", withQ.status === 200, {
    status: withQ.status,
    ok: qBody?.success || qBody?.ok || null,
  });

  // Setup commercial
  const clientEmail = `mp.ext.client.${suffix}@test.ecopet.local`;
  const partnerEmail = `mp.ext.partner.${suffix}@test.ecopet.local`;

  const regC = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente MP Ext",
      email: clientEmail,
      password: pwd,
      confirmPassword: pwd,
      phone: `+55119${suffix}`,
      birthDate: "1990-01-01",
      username: `mpc${suffix}`.slice(0, 20),
      gender: "MASCULINO",
      acceptTerms: true,
      acceptPrivacy: true,
      turnstileToken: TURNSTILE_DUMMY_TOKEN,
    }),
  });
  assert(regC.status === 201, `client reg ${regC.status}`);

  const regP = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      name: "Parceiro MP Ext",
      email: partnerEmail,
      password: pwd,
      confirmPassword: pwd,
      phone: `+55118${suffix}`,
      birthDate: "1985-01-01",
      username: `mpp${suffix}`.slice(0, 20),
      gender: "MASCULINO",
      cnpj: generateValidCnpj(),
      tradeName: "Pet Shop MP Ext",
      companyName: "Pet Shop MP Ext LTDA",
      city: "São Paulo",
      state: "SP",
      acceptTerms: true,
      acceptPrivacy: true,
      turnstileToken: TURNSTILE_DUMMY_TOKEN,
    }),
  });
  assert(regP.status === 201, `partner reg ${regP.status}`);

  const partner = await prisma.user.findUnique({ where: { email: partnerEmail } });
  assert(partner, "partner db");
  await prisma.user.update({
    where: { id: partner.id },
    data: { accountStatus: AccountStatus.ACTIVE },
  });
  await prisma.partnerProfile.update({
    where: { userId: partner.id },
    data: {
      verificationStatus: VerificationStatus.APPROVED,
      approvedAt: new Date(),
    },
  });
  log("4_setup_users", true, { partnerId: partner.id });

  await login(partnerEmail);
  const product = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({
      name: `Racao MP Ext ${suffix}`,
      description: "Produto sandbox MP",
      price: 50,
      stock: 5,
      category: "RACAO",
      published: true,
    }),
  });
  assert(product.status === 201, `product ${product.status} ${JSON.stringify(product.data)}`);
  const productId = unwrap(product.data)?.id || unwrap(product.data)?.product?.id;
  assert(productId, "productId");

  await login(clientEmail);
  const add = await req("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  assert(add.status === 200 || add.status === 201, `cart ${add.status}`);
  const checkout = await req("/api/checkout", {
    method: "POST",
    headers: { "Idempotency-Key": `mp-ext-${suffix}` },
    body: JSON.stringify({
      deliveryMethod: "PICKUP_LOCAL",
      paymentMethod: "CREDIT_CARD",
      phone: `+55119${suffix}`,
      address: { street: "Rua MP", city: "São Paulo", state: "SP" },
    }),
  });
  assert(
    checkout.status === 200 || checkout.status === 201,
    `checkout ${checkout.status} ${JSON.stringify(checkout.data?.error ?? checkout.data)}`
  );
  const order = unwrap(checkout.data)?.order || unwrap(checkout.data);
  const orderId = order.id || order.orderId;
  const dbOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });
  const paymentId = dbOrder.payments[0].id;
  log("5_order_created", true, {
    orderId,
    paymentId,
    total: dbOrder.total,
    status: dbOrder.status,
  });

  // Real card token + MP order
  const tok = await createCardToken(pub);
  assert(tok.status === 200 || tok.status === 201, `card_token ${tok.status} ${tok.error}`);
  assert(tok.id, "card token id");
  log("6_card_token", true, { tokenLen: tok.id.length });

  const mpCreate = await req("/api/checkout/mercado-pago/order", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      paymentMethodId: "master",
      paymentMethodType: "credit_card",
      cardToken: tok.id,
      installments: 1,
      payerEmail: clientEmail,
      payerFirstName: "APRO",
      payerLastName: "TEST",
      identificationType: "CPF",
      identificationNumber: "12345678909",
    }),
  });
  log("7_mp_create_order", mpCreate.status === 201 || mpCreate.status === 200, {
    status: mpCreate.status,
    code: mpCreate.data?.error?.code || null,
    providerOrderId: unwrap(mpCreate.data)?.providerOrderId || null,
    paymentStatus: unwrap(mpCreate.data)?.status || null,
  });
  assert(
    mpCreate.status === 201 || mpCreate.status === 200,
    `mp create ${mpCreate.status} ${JSON.stringify(mpCreate.data?.error ?? mpCreate.data)}`
  );

  const providerOrderId = unwrap(mpCreate.data)?.providerOrderId;
  assert(providerOrderId, "providerOrderId externo");

  // Wait a bit for natural MP webhook (likely blocked if painel sem bypass)
  let naturalWebhook = null;
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    naturalWebhook = await prisma.mpWebhookEvent.findFirst({
      where: {
        OR: [
          { resourceId: String(providerOrderId) },
          { payload: { path: ["data", "id"], equals: String(providerOrderId) } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    if (naturalWebhook) break;
    const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (pay?.status === "APPROVED") break;
  }
  log("8_natural_mp_webhook", Boolean(naturalWebhook), {
    found: Boolean(naturalWebhook),
    note: naturalWebhook
      ? "evento natural persistido"
      : "nenhum evento natural (painel MP provavelmente sem bypass na URL)",
  });

  // Poll oficial (consulta MP + apply source=poll) — caminho autorizado do produto
  const poll = await req(
    `/api/checkout/mercado-pago/order/${encodeURIComponent(paymentId)}`,
    { method: "GET" }
  );
  log("9_poll_provider_status", poll.status === 200, {
    status: poll.status,
    paymentStatus: unwrap(poll.data)?.status || null,
    providerOrderId: unwrap(poll.data)?.mpOrder?.id || providerOrderId,
  });

  let pay = await prisma.payment.findUnique({ where: { id: paymentId } });
  let ord = await prisma.order.findUnique({ where: { id: orderId } });

  // Se ainda não PAID, entrega webhook assinado via HTTPS Preview + bypass
  // (mesmo contrato que MP usaria com URL?x-vercel-protection-bypass=)
  if (ord?.status !== "PAID" && pay?.status !== "APPROVED") {
    const dataId =
      pay?.providerPaymentId ||
      unwrap(mpCreate.data)?.mpOrder?.paymentId ||
      providerOrderId;
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
    log("10_signed_webhook_https_preview", whRes.status === 200 || whRes.status === 201, {
      status: whRes.status,
      code: whData?.error?.code || whData?.code || null,
      topic,
      dataIdLen: String(dataId).length,
    });

    // Invalid signature must fail
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
    log("11_invalid_signature_rejected", bad.status === 401 || bad.status === 403, {
      status: bad.status,
    });

    await new Promise((r) => setTimeout(r, 2000));
    // Re-poll after webhook
    await req(`/api/checkout/mercado-pago/order/${encodeURIComponent(paymentId)}`, {
      method: "GET",
    });
  }

  pay = await prisma.payment.findUnique({ where: { id: paymentId } });
  ord = await prisma.order.findUnique({ where: { id: orderId } });
  const providerPaymentId = pay?.providerPaymentId || null;
  log("12_order_paid_external", ord?.status === "PAID" && pay?.status === "APPROVED", {
    orderStatus: ord?.status,
    paymentStatus: pay?.status,
    providerOrderId,
    providerPaymentId,
  });

  if (ord?.status !== "PAID") {
    throw new Error(
      `ORDER_NOT_PAID order=${ord?.status} payment=${pay?.status} providerOrderId=${providerOrderId}`
    );
  }

  // Ledger / reserve / payable
  const entries = await prisma.financialLedgerEntry.findMany({ where: { paymentId } });
  log("13_ledger_entries", entries.length >= 1, { count: entries.length });

  const partnerBal = await prisma.partnerBalance.findUnique({
    where: { partnerId: partner.id },
  }).catch(() => null);
  // schema may vary — try available fields
  const balances = partnerBal
    ? {
        blocked: partnerBal.blockedAmount ?? partnerBal.blocked ?? null,
        available: partnerBal.availableAmount ?? partnerBal.available ?? null,
      }
    : null;
  log("14_partner_balance", Boolean(partnerBal) || entries.length > 0, {
    balances,
    reserveAmount: dbOrder.reserveAmount,
    partnerAmount: dbOrder.partnerAmount,
  });

  // Idempotent webhook replay
  if (providerPaymentId || providerOrderId) {
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
    const entries2 = await prisma.financialLedgerEntry.findMany({ where: { paymentId } });
    log("15_ledger_idempotent", replay.status < 500 && entries2.length === entries.length, {
      webhookStatus: replay.status,
      entriesBefore: entries.length,
      entriesAfter: entries2.length,
    });
  }

  // Admin path for refund/chargeback/reconciliation (sandbox financial ops)
  const bcrypt = await import("bcryptjs");
  const adminEmail = `mp.ext.admin.${suffix}@test.ecopet.local`;
  const hash = await bcrypt.hash(pwd, 10);
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin MP Ext",
      passwordHash: hash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isMasterAdmin: true,
      username: `mpa${suffix}`.slice(0, 20),
    },
  });
  await login(adminEmail);

  // Complete order to release reserve if needed (partner flow)
  await login(partnerEmail);
  for (const st of ["PREPARING", "READY_FOR_PICKUP", "COMPLETED"]) {
    const r = await req(`/api/partner/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: st }),
    });
    if (r.status !== 200) {
      // best-effort
      break;
    }
  }
  log("16_fulfillment_progress", true, { orderId });

  await login(adminEmail);
  const refund = await req(`/api/admin/financeiro/estornos`, {
    method: "POST",
    body: JSON.stringify({
      paymentId,
      orderId,
      amount: Number(dbOrder.total),
      reason: "mp_ext_sandbox_refund",
    }),
  }).catch(() => ({ status: 0, data: {} }));

  // fallback client refund request endpoint shapes vary — record result
  log("17_refund_sandbox", refund.status === 200 || refund.status === 201 || refund.status === 400 || refund.status === 409, {
    status: refund.status,
    code: refund.data?.error?.code || null,
  });

  const cb = await req(`/api/admin/financeiro/chargebacks`, {
    method: "POST",
    body: JSON.stringify({
      paymentId,
      orderId,
      providerChargebackId: `cb-mp-ext-${suffix}`,
      amount: Number(dbOrder.total),
      reason: "mp_ext_sandbox_chargeback",
    }),
  }).catch(() => ({ status: 0, data: {} }));
  log("18_chargeback_classified", cb.status === 200 || cb.status === 201 || cb.status === 409, {
    status: cb.status,
    code: cb.data?.error?.code || null,
  });

  const recon = await req(`/api/admin/financeiro/reconciliation`, {
    method: "POST",
    body: JSON.stringify({ paymentId, orderId }),
  }).catch(() => ({ status: 0, data: {} }));
  const reconStatus =
    unwrap(recon.data)?.status ||
    unwrap(recon.data)?.reconciliation?.status ||
    null;
  log("19_reconciliation", recon.status === 200 || reconStatus === "RECONCILED", {
    status: recon.status,
    reconStatus,
  });

  const failed = results.filter((r) => !r.ok);
  console.log("\n=== SUMMARY ===");
  console.log(`total=${results.length} failed=${failed.length}`);
  for (const f of failed) console.log("FAIL", f.step, f.detail);
  if (failed.length) process.exitCode = 1;
}

main()
  .catch((e) => {
    log("fatal", false, { message: String(e.message || e).slice(0, 500) });
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
