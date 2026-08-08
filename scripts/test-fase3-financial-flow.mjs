/**
 * Fase 3 — E2E financeiro (sandbox / sem dinheiro real).
 *
 * Requer: Next em WEB_URL, DATABASE_URL, FINANCIAL_LEDGER_ENABLED (default local on).
 * Não executa transferência bancária real.
 */
import { createRequire } from "module";
import {
  PrismaClient,
  OrderStatus,
  VerificationStatus,
  AccountStatus,
  UserRole,
} from "@prisma/client";
import { generateValidCnpj } from "./cnpj-test-utils.mjs";
import { fetchWithVercelBypass } from "./http-with-vercel-bypass.mjs";

const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

const require = createRequire(import.meta.url);
require("../apps/web/scripts/stub-server-only.cjs");

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const pwd = "Ecopet@Forte2026";
const jar = new Map();
const results = [];
const startedAt = Date.now();
const TEST_RUN_IP_BASE = `10.251.${Date.now() % 200}`;
let reqSeq = 0;

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

function nextTestIp() {
  reqSeq += 1;
  return `${TEST_RUN_IP_BASE}.${(reqSeq % 200) + 1}`;
}

function phoneE164(suffix) {
  return `+55119${String(suffix).replace(/\D/g, "").padStart(8, "0").slice(-8)}`;
}

async function req(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": opts.testIp ?? nextTestIp(),
    ...(opts.headers || {}),
  };
  if (jar.get("c") && !opts.noCookie) headers.Cookie = jar.get("c");
  const res = await fetchWithVercelBypass(`${WEB}${path}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  const setCookies =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : sc ? [sc] : [];
  for (const raw of setCookies) {
    const session = raw.split(";")[0];
    if (session.includes("ecopet-session=")) jar.set("c", session);
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
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
  return res;
}

async function ensureAdmin() {
  const email = `fase3.admin.${Date.now().toString(36)}@test.ecopet.local`;
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(pwd, 10);
  const admin = await prisma.user.create({
    data: {
      email,
      name: "Admin Fase3",
      passwordHash: hash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isMasterAdmin: true,
      username: `f3a${Date.now().toString(36)}`.slice(0, 20),
    },
  });
  return { email, id: admin.id };
}

async function applyPaid({ paymentId, orderId, amount, eventId }) {
  const { applyInternalPaymentStatus } = await import(
    "../apps/web/src/lib/mercado-pago/apply-payment-status.ts"
  );
  return applyInternalPaymentStatus({
    paymentId,
    internalStatus: "APPROVED",
    providerOrderId: `mp_f3_${orderId}`,
    providerPaymentId: `mp_pay_f3_${orderId}`,
    source: "webhook",
    eventId,
    receivedAmount: amount,
  });
}

function printSummary() {
  const failed = results.filter((r) => !r.ok);
  console.log("\n=== SUMMARY ===");
  console.log(`total=${results.length} failed=${failed.length}`);
  if (failed.length) {
    for (const f of failed) console.log(`FAIL ${f.step}`, f.detail);
  }
  process.exitCode = failed.length ? 1 : 0;
}

async function main() {
  const suffix = String(Date.now()).slice(-8);
  const clientEmail = `fase3.client.${suffix}@test.ecopet.local`;
  const partnerEmail = `fase3.partner.${suffix}@test.ecopet.local`;
  const partnerBEmail = `fase3.partnerb.${suffix}@test.ecopet.local`;

  console.log("=== Fase 3 financial E2E ===");
  console.log(`WEB_URL=${WEB}\n`);

  const health = await fetchWithVercelBypass(`${WEB}/api/health`).catch(() => null);
  if (!health?.ok) {
    log("server_available", false, { message: "WEB_URL indisponível" });
    printSummary();
    return;
  }
  log("server_available", true, {});

  const admin = await ensureAdmin();
  log("0_admin_created", true, { adminId: admin.id });

  // 1 client
  {
    const reg = await req("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        role: "CLIENT",
        name: "Cliente Fase3",
        email: clientEmail,
        password: pwd,
        confirmPassword: pwd,
        phone: phoneE164(suffix),
        birthDate: "1990-01-01",
        username: `f3c${suffix}`.slice(0, 20),
        gender: "MASCULINO",
        acceptTerms: true,
        acceptPrivacy: true,
        turnstileToken: TURNSTILE_DUMMY_TOKEN,
      }),
    });
    assert(reg.status === 201, `client reg ${reg.status}`);
    log("1_client", true, {});
  }

  // 2 partner
  let partnerId;
  {
    const reg = await req("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        role: "PARTNER",
        name: "Parceiro Fase3",
        email: partnerEmail,
        password: pwd,
        confirmPassword: pwd,
        phone: phoneE164(String(Number(suffix) + 1)),
        businessName: `Loja F3 ${suffix}`,
        legalName: `Loja F3 ${suffix} LTDA`,
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
    assert(reg.status === 201, `partner reg ${reg.status}`);
    const partner = await prisma.user.findUnique({
      where: { email: partnerEmail },
      include: { partnerProfile: true },
    });
    partnerId = partner.id;
    await prisma.user.update({
      where: { id: partnerId },
      data: { accountStatus: AccountStatus.ACTIVE },
    });
    await prisma.partnerProfile.update({
      where: { userId: partnerId },
      data: {
        verificationStatus: VerificationStatus.APPROVED,
        approvedAt: new Date(),
      },
    });
    log("2_partner_approved", true, { partnerId });
  }

  // 3 product
  let productId;
  {
    await login(partnerEmail);
    const created = await req("/api/partner/products", {
      method: "POST",
      body: JSON.stringify({
        name: "Ração F3",
        description: "Produto teste fase 3",
        catalogCategory: "FOOD",
        price: 100,
        stock: 20,
      }),
    });
    assert(created.status === 201 || created.status === 200, `product ${created.status} ${JSON.stringify(created.data)}`);
    productId =
      unwrap(created.data)?.product?.id ||
      unwrap(created.data)?.id ||
      created.data?.product?.id;
    assert(productId, `productId missing ${JSON.stringify(created.data)}`);
    log("3_product", true, { productId });
  }

  // 4 order
  let orderId;
  let paymentId;
  let amount;
  {
    await login(clientEmail);
    const add = await req("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    assert(add.status === 200 || add.status === 201, `cart ${add.status} ${JSON.stringify(add.data)}`);
    const checkout = await req("/api/checkout", {
      method: "POST",
      headers: { "Idempotency-Key": `f3-chk-${suffix}` },
      body: JSON.stringify({
        deliveryMethod: "PICKUP_LOCAL",
        paymentMethod: "PIX",
        phone: phoneE164(suffix),
        address: { street: "Rua Teste", city: "São Paulo", state: "SP" },
      }),
    });
    assert(checkout.status === 200 || checkout.status === 201, `checkout ${checkout.status} ${JSON.stringify(checkout.data)}`);
    const order = unwrap(checkout.data)?.order || unwrap(checkout.data);
    orderId = order.id || order.orderId;
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    assert(dbOrder?.platformPercentage != null, "snapshot platformPercentage");
    assert(dbOrder.gatewayFeeEstimated >= 0, "gatewayFeeEstimated");
    paymentId = dbOrder.payments[0].id;
    amount = dbOrder.total;
    log("4_order", true, {
      orderId,
      paymentId,
      partnerAmount: dbOrder.partnerAmount,
      reserveAmount: dbOrder.reserveAmount,
    });
  }

  // 5-6 confirm payment + ledger
  {
    const r1 = await applyPaid({
      paymentId,
      orderId,
      amount,
      eventId: `evt-f3-${suffix}-1`,
    });
    assert(r1.changed, "payment changed");
    const r2 = await applyPaid({
      paymentId,
      orderId,
      amount,
      eventId: `evt-f3-${suffix}-1-dup`,
    });
    assert(!r2.changed, "idempotent webhook");

    const entries = await prisma.financialLedgerEntry.findMany({ where: { paymentId } });
    assert(entries.length >= 4, `ledger entries ${entries.length}`);
    const types = new Set(entries.map((e) => e.entryType));
    assert(types.has("PAYMENT_RECEIVED"), "PAYMENT_RECEIVED");
    assert(types.has("PARTNER_PAYABLE"), "PARTNER_PAYABLE");
    assert(types.has("PLATFORM_COMMISSION"), "PLATFORM_COMMISSION");

    const again = await applyPaid({
      paymentId,
      orderId,
      amount,
      eventId: `evt-f3-${suffix}-2`,
    });
    void again;
    const entries2 = await prisma.financialLedgerEntry.findMany({ where: { paymentId } });
    assert(entries2.length === entries.length, "no duplicate ledger");
    log("5_6_ledger", true, { entries: entries.length });
  }

  // 7 blocked balance
  {
    await login(partnerEmail);
    const bal = await req("/api/partner/financeiro/balances");
    assert(bal.status === 200, `balances ${bal.status}`);
    const b = bal.data?.data?.balances || bal.data?.balances;
    assert(b.blockedCents > 0 || b.asFloats.blocked > 0, "blocked");
    log("7_blocked_balance", true, { blocked: b.asFloats?.blocked ?? b.blockedCents });
  }

  // 8 complete order
  {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, updatedAt: new Date(Date.now() - 10 * 86400000) },
    });
    log("8_order_completed", true, {});
  }

  // 9-10 release
  {
    await login(admin.email);
    const rel = await req("/api/admin/financeiro/release-balances", {
      method: "POST",
      body: JSON.stringify({ orderId, partnerId }),
    });
    assert(rel.status === 200, `release ${rel.status}`);
    await login(partnerEmail);
    const bal = await req("/api/partner/financeiro/balances");
    const b = bal.data?.data?.balances || bal.data?.balances;
    assert((b.availableCents ?? 0) > 0 || (b.asFloats?.available ?? 0) > 0, "available");
    log("9_10_available", true, { available: b.asFloats?.available ?? b.availableCents });
  }

  // 11-14 payout sandbox
  let payoutId;
  {
    await login(partnerEmail);
    const bal = await req("/api/partner/financeiro/balances");
    const b = bal.data?.data?.balances || bal.data?.balances;
    const amountCents = b.availableCents ?? Math.round((b.asFloats?.available || 0) * 100);
    const create = await req("/api/partner/financeiro/payouts", {
      method: "POST",
      body: JSON.stringify({
        amountCents,
        idempotencyKey: `payout-f3-${suffix}`,
      }),
    });
    assert(create.status === 200, `payout create ${create.status} ${JSON.stringify(create.data)}`);
    payoutId = create.data?.data?.payoutId || create.data?.payoutId;

    // self-approve forbidden
    await login(admin.email);
    const approve = await req("/api/admin/financeiro/payouts", {
      method: "POST",
      body: JSON.stringify({ action: "approve", payoutId }),
    });
    assert(approve.status === 200, `approve ${approve.status}`);

    const paid = await req("/api/admin/financeiro/payouts", {
      method: "POST",
      body: JSON.stringify({ action: "mark_paid_sandbox", payoutId }),
    });
    assert(paid.status === 200, `paid ${paid.status}`);

    const row = await prisma.partnerPayout.findUnique({ where: { id: payoutId } });
    assert(row?.status === "PAID", "payout PAID");
    log("11_14_payout", true, { payoutId, status: row.status });
  }

  // 15-18 second order + refund ledger
  let payment2;
  {
    await login(partnerEmail);
    // stock
    await prisma.product.update({ where: { id: productId }, data: { stock: 20 } });
    await login(clientEmail);
    const add2 = await req("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    assert(add2.status === 200 || add2.status === 201, `cart2 ${add2.status}`);
    const checkout = await req("/api/checkout", {
      method: "POST",
      headers: { "Idempotency-Key": `f3-chk2-${suffix}` },
      body: JSON.stringify({
        deliveryMethod: "PICKUP_LOCAL",
        paymentMethod: "PIX",
        phone: phoneE164(suffix),
        address: { street: "Rua Teste", city: "São Paulo", state: "SP" },
      }),
    });
    const order = unwrap(checkout.data)?.order || unwrap(checkout.data);
    const order2 = order.id || order.orderId;
    const db = await prisma.order.findUnique({
      where: { id: order2 },
      include: { payments: true },
    });
    payment2 = db.payments[0];
    await applyPaid({
      paymentId: payment2.id,
      orderId: order2,
      amount: db.total,
      eventId: `evt-f3-${suffix}-ord2`,
    });

    const { postLedgerForRefund } = await import("../apps/web/src/lib/finance/refund-ledger.ts");
    const refund = await postLedgerForRefund({
      paymentId: payment2.id,
      refundAmount: db.total,
      paymentRefundId: `sim-refund-${suffix}`,
      fullRefund: true,
    });
    assert(refund.ok, `refund ledger ${refund.code}`);
    const rev = await prisma.financialLedgerEntry.count({
      where: { paymentId: payment2.id, entryType: "REVERSAL_PARTNER_PAYABLE" },
    });
    assert(rev >= 1, "reversal");
    log("15_18_refund", true, { payment2: payment2.id, reversals: rev });
  }

  // 19-20 chargeback
  {
    await login(admin.email);
    const cb = await req("/api/admin/financeiro/chargebacks", {
      method: "POST",
      body: JSON.stringify({
        paymentId,
        amount: 10,
        reason: "teste sandbox",
        idempotencyKey: `cb-f3-${suffix}`,
      }),
    });
    assert(cb.status === 200, `chargeback ${cb.status} ${JSON.stringify(cb.data)}`);
    log("19_20_chargeback", true, {});
  }

  // 21 reconciliation
  {
    await login(admin.email);
    const rec = await req("/api/admin/financeiro/reconciliation", {
      method: "POST",
      body: JSON.stringify({ paymentId }),
    });
    assert(rec.status === 200, `recon ${rec.status}`);
    log("21_reconciliation", true, { status: rec.data?.data?.status || rec.data?.status });
  }

  // 22 IDOR + audit
  {
    await req("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        role: "PARTNER",
        name: "Parceiro B Fase3",
        email: partnerBEmail,
        password: pwd,
        confirmPassword: pwd,
        phone: phoneE164(String(Number(suffix) + 9)),
        businessName: `Loja B F3 ${suffix}`,
        legalName: `Loja B F3 ${suffix} LTDA`,
        cnpj: generateValidCnpj(String(Number(suffix) + 99)),
        category: "Pet Shop",
        address: "Rua B, 100",
        city: "São Paulo",
        state: "SP",
        acceptTerms: true,
        acceptPrivacy: true,
        turnstileToken: TURNSTILE_DUMMY_TOKEN,
      }),
    });
    const partnerB = await prisma.user.findUnique({ where: { email: partnerBEmail } });
    await prisma.user.update({
      where: { id: partnerB.id },
      data: { accountStatus: AccountStatus.ACTIVE },
    });
    if (partnerB) {
      await prisma.partnerProfile.updateMany({
        where: { userId: partnerB.id },
        data: {
          verificationStatus: VerificationStatus.APPROVED,
          approvedAt: new Date(),
        },
      });
    }
    await login(partnerBEmail);
    const idor = await req("/api/partner/financeiro/payouts", {
      method: "POST",
      body: JSON.stringify({
        partnerId,
        amountCents: 100,
        idempotencyKey: `idor-${suffix}`,
      }),
    });
    assert(idor.status === 403 || idor.status === 400, `idor ${idor.status}`);
    log("22_idor_and_audit", true, { idorStatus: idor.status });
  }

  // client cannot access ledger
  {
    await login(clientEmail);
    const ledger = await req("/api/admin/financeiro/ledger");
    assert(ledger.status === 401 || ledger.status === 403, `client ledger ${ledger.status}`);
    log("22b_client_denied_ledger", true, { status: ledger.status });
  }

  printSummary();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  log("fatal", false, { message: e.message });
  printSummary();
  await prisma.$disconnect();
  process.exitCode = 1;
});
