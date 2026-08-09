/**
 * Fresh sandbox: charge (visa + @testuser.com) → PAID → refund Orders API → RECONCILED.
 * Also retries refund on existing PAID payment if provided via env EXISTING_PAYMENT_ID.
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

const verify = loadEnvFile(path.join(process.cwd(), "apps/web/.env.preview.verify"));
const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
for (const [k, v] of Object.entries({ ...verify, ...e2e })) {
  if (!process.env[k]) process.env[k] = v;
}
for (const k of ["DATABASE_URL", "DIRECT_URL"]) {
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
const results = [];

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

async function req(p, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": `10.255.${Date.now() % 200}.${(Math.random() * 200) | 0}`,
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
  return { status: res.status, id: data.id || null };
}

async function refundAndReconcile(paymentId, adminEmail) {
  await login(adminEmail);
  const refund = await req(`/api/admin/financeiro/estornos`, {
    method: "POST",
    body: JSON.stringify({
      paymentId,
      full: true,
      reason: "sandbox orders api refund",
      action: "execute",
    }),
  });
  const rd = unwrap(refund.data);
  log("refund", refund.status === 200 || refund.status === 201, {
    status: refund.status,
    code: refund.data?.error?.code || null,
    message: (refund.data?.error?.message || "").slice(0, 200),
    providerRefundPrefix: rd?.providerRefundId
      ? String(rd.providerRefundId).slice(0, 8)
      : rd?.refund?.providerRefundId
        ? String(rd.refund.providerRefundId).slice(0, 8)
        : null,
  });

  const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
  log("payment_after_refund", pay?.status === "REFUNDED" || pay?.status === "PARTIALLY_REFUNDED", {
    status: pay?.status,
    refundedAmount: pay?.refundedAmount ?? null,
  });

  const recon = await req(`/api/admin/financeiro/reconciliation`, {
    method: "POST",
    body: JSON.stringify({ paymentId }),
  });
  const body = unwrap(recon.data);
  const reconStatus = body?.status || body?.reconciliation?.status || null;
  log("reconciliation", recon.status === 200 && reconStatus === "RECONCILED", {
    status: recon.status,
    reconStatus,
    details: body?.details ? JSON.stringify(body.details).slice(0, 200) : null,
  });
}

try {
  // Prefer existing APPROVED payment without successful refund
  const existingId = process.env.EXISTING_PAYMENT_ID || "cmskze7by004klg04ktfdcxhf";
  const existing = await prisma.payment.findUnique({ where: { id: existingId } });
  const bcrypt = await import("bcryptjs");
  const adminEmail = `mp.ref.admin.${suffix}@test.ecopet.local`;
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin Refund",
      passwordHash: await bcrypt.hash(pwd, 10),
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isMasterAdmin: true,
      username: `mra${suffix}`.slice(0, 20),
    },
  });

  if (existing && existing.status === "APPROVED" && existing.providerOrderId) {
    log("using_existing", true, {
      paymentId: existingId,
      providerOrderId: existing.providerOrderId,
      providerPaymentId: existing.providerPaymentId,
    });
    await refundAndReconcile(existingId, adminEmail);
  } else {
    log("using_existing", false, { reason: "not_approved_or_missing" });
  }

  // Always also create a clean charge for RECONCILED in normal scenario (no prior chargeback)
  const clientEmail = `mp.ref.client.${suffix}@test.ecopet.local`;
  const partnerEmail = `mp.ref.partner.${suffix}@test.ecopet.local`;
  const payerEmail = `ecopet.buyer.${suffix}@testuser.com`;

  await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Ref",
      email: clientEmail,
      password: pwd,
      confirmPassword: pwd,
      phone: `+55119${suffix.padStart(8, "0").slice(-8)}`,
      birthDate: "1990-01-01",
      username: `mrc${suffix}`.slice(0, 20),
      gender: "MASCULINO",
      acceptTerms: true,
      acceptPrivacy: true,
      turnstileToken: TURNSTILE_DUMMY_TOKEN,
    }),
  });
  await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      name: "Parceiro Ref",
      email: partnerEmail,
      password: pwd,
      confirmPassword: pwd,
      phone: `+55118${suffix.padStart(8, "0").slice(-8)}`,
      businessName: `Loja Ref ${suffix}`,
      legalName: `Loja Ref ${suffix} LTDA`,
      cnpj: generateValidCnpj(suffix),
      category: "Pet Shop",
      address: "Rua A, 100",
      city: "São Paulo",
      state: "SP",
      acceptTerms: true,
      acceptPrivacy: true,
      turnstileToken: TURNSTILE_DUMMY_TOKEN,
    }),
  });
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

  await login(partnerEmail);
  const product = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({
      name: `Racao Ref ${suffix}`,
      description: "Produto refund",
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
    headers: { "Idempotency-Key": `mp-ref-${suffix}` },
    body: JSON.stringify({
      deliveryMethod: "PICKUP_LOCAL",
      paymentMethod: "CARD",
      phone: `+55119${suffix.padStart(8, "0").slice(-8)}`,
      address: { street: "Rua MP", city: "São Paulo", state: "SP" },
    }),
  });
  const order = unwrap(checkout.data)?.order || unwrap(checkout.data);
  const orderId = order.id;
  assert(orderId, "orderId");

  const cfg = unwrap((await req("/api/checkout/mercado-pago/config")).data);
  assert(cfg.environment === "test" && cfg.publicKey, "mp config");
  const tok = await createCardToken(cfg.publicKey);
  assert(tok.id, "card token");

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
  const providerOrderId = unwrap(mpCreate.data)?.providerOrderId;
  log("charge", mpCreate.status === 201 || mpCreate.status === 200, {
    status: mpCreate.status,
    code: mpCreate.data?.error?.code || null,
    providerOrderId,
  });
  assert(providerOrderId && /^ORD/i.test(providerOrderId), "real ORD id");

  const dbPay = await prisma.payment.findFirst({
    where: { orderId, provider: "mercado_pago", providerOrderId },
  });
  assert(dbPay, "db payment");

  await req(`/api/checkout/mercado-pago/order/${encodeURIComponent(dbPay.id)}`, { method: "GET" });
  let pay = await prisma.payment.findUnique({ where: { id: dbPay.id } });
  let ord = await prisma.order.findUnique({ where: { id: orderId } });
  log("paid", ord?.status === "PAID" && pay?.status === "APPROVED", {
    orderStatus: ord?.status,
    paymentStatus: pay?.status,
    providerPaymentId: pay?.providerPaymentId,
  });
  assert(ord?.status === "PAID", "order paid");

  // Reconcile BEFORE refund (normal scenario)
  await login(adminEmail);
  const recon1 = await req(`/api/admin/financeiro/reconciliation`, {
    method: "POST",
    body: JSON.stringify({ paymentId: dbPay.id }),
  });
  const r1 = unwrap(recon1.data);
  log("recon_before_refund", recon1.status === 200 && r1?.status === "RECONCILED", {
    status: recon1.status,
    reconStatus: r1?.status || null,
  });

  await refundAndReconcile(dbPay.id, adminEmail);

  const failed = results.filter((r) => !r.ok);
  console.log("\n=== SUMMARY ===");
  console.log(`total=${results.length} failed=${failed.length}`);
  for (const f of failed) console.log("FAIL", f.step, f.detail);
  if (failed.length) process.exitCode = 1;
} catch (e) {
  log("fatal", false, { message: String(e.message || e).slice(0, 400) });
  console.error(e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => undefined);
}
