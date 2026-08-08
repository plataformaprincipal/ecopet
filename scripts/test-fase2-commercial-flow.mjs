/**
 * Fase 2.1 — E2E HTTP comercial (servidor real em WEB_URL).
 *
 * Requer:
 * - Next.js em WEB_URL (default http://localhost:3000)
 * - DATABASE_URL (Prisma)
 * - Opcional: EXPRESS_URL (default http://localhost:4000) para assert 410
 *
 * Pagamento: confirmação autorizada via applyInternalPaymentStatus(source=webhook)
 * (sem cobrança real). Assinatura HMAC inválida testada via HTTP no webhook Next.
 *
 * Saída: JSONL de steps em stdout + resumo. Exit 0 só se todos obrigatórios passarem.
 */
import { PrismaClient, OrderStatus, VerificationStatus, AccountStatus } from "@prisma/client";
import { generateValidCnpj } from "./cnpj-test-utils.mjs";
import { createHmac } from "crypto";
import { fetchWithVercelBypass } from "./http-with-vercel-bypass.mjs";

/** Token dummy oficial Cloudflare Turnstile (test keys). */
const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const EXPRESS = process.env.EXPRESS_URL || "http://localhost:4000";
const prisma = new PrismaClient();
const pwd = "Ecopet@Forte2026";
const jar = new Map();
const TEST_RUN_IP_BASE = `10.250.${Date.now() % 200}`;
let reqSeq = 0;
const results = [];
const startedAt = Date.now();

function log(step, ok, detail = {}, required = true) {
  const row = {
    step,
    ok: Boolean(ok),
    required,
    detail: typeof detail === "string" ? { message: detail } : detail,
    tMs: Date.now() - startedAt,
  };
  results.push(row);
  console.log(`${ok ? "✓" : "✗"} ${step}${ok ? "" : " FAIL"} ${JSON.stringify(row.detail)}`);
}

function assert(c, m) {
  if (!c) throw new Error(m);
}

function nextTestIp() {
  reqSeq += 1;
  return `${TEST_RUN_IP_BASE}.${(reqSeq % 200) + 1}`;
}

function phoneE164(suffix) {
  return `+55119${String(suffix).replace(/\D/g, "").padStart(8, "0").slice(-8)}`;
}

function unwrap(data) {
  return data?.data ?? data;
}

async function req(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": opts.testIp ?? nextTestIp(),
    ...(opts.headers || {}),
  };
  if (jar.get("c") && !opts.noCookie) headers.Cookie = jar.get("c");
  const t0 = Date.now();
  const res = await fetchWithVercelBypass(`${WEB}${path}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  const setCookies =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : sc ? [sc] : [];
  for (const raw of setCookies) {
    const session = raw.split(";")[0];
    if (session.includes("ecopet-session=")) jar.set("c", session);
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, ms: Date.now() - t0, method: opts.method || "GET", path };
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
  return res;
}

async function registerClient(email, suffix) {
  jar.clear();
  const uniq = String(suffix).replace(/\D/g, "").slice(-10) || String(Date.now()).slice(-10);
  return req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Fase21",
      email,
      password: pwd,
      confirmPassword: pwd,
      phone: phoneE164(suffix),
      birthDate: "1990-01-01",
      username: `f21c${uniq}`.slice(0, 20),
      gender: "MASCULINO",
      acceptTerms: true,
      acceptPrivacy: true,
      turnstileToken: TURNSTILE_DUMMY_TOKEN,
    }),
  });
}

async function registerPartner(email, suffix) {
  jar.clear();
  return req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      name: "Parceiro Fase21",
      email,
      password: pwd,
      confirmPassword: pwd,
      phone: phoneE164(suffix),
      businessName: `Loja Fase21 ${suffix}`,
      legalName: `Loja Fase21 ${suffix} LTDA`,
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
}

async function approvePartner(email) {
  const partner = await prisma.user.findUnique({
    where: { email },
    include: { partnerProfile: true },
  });
  assert(partner?.partnerProfile, "partner profile missing");
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
  return partner;
}

async function applyPaid({ paymentId, orderId, amount, eventId, receivedAmount }) {
  process.env.TSX_TSCONFIG_PATH = "apps/web/tsconfig.json";
  // stub server-only para importar apply em script Node (sem Next runtime)
  await import("module").then(({ createRequire }) => {
    const require = createRequire(import.meta.url);
    require("../apps/web/scripts/stub-server-only.cjs");
  }).catch(() => {
    /* already stubbed via --require */
  });
  const { applyInternalPaymentStatus } = await import(
    "../apps/web/src/lib/mercado-pago/apply-payment-status.ts"
  );
  return applyInternalPaymentStatus({
    paymentId,
    internalStatus: "APPROVED",
    providerOrderId: `mp_test_${orderId}`,
    providerPaymentId: `mp_pay_${orderId}`,
    source: "webhook",
    eventId,
    receivedAmount: receivedAmount ?? amount,
  });
}

async function main() {
  const suffix = String(Date.now()).slice(-8);
  const clientEmail = `fase21.client.${suffix}@test.ecopet.local`;
  const partnerEmail = `fase21.partner.${suffix}@test.ecopet.local`;
  const partnerBEmail = `fase21.partnerb.${suffix}@test.ecopet.local`;
  const clientBEmail = `fase21.clientb.${suffix}@test.ecopet.local`;
  let orderId = null;
  let productId = null;
  let paymentId = null;
  let partnerId = null;
  let clientId = null;

  console.log("=== Fase 2.1 commercial E2E ===");
  console.log(`WEB_URL=${WEB}`);
  console.log(`EXPRESS_URL=${EXPRESS}\n`);

  // health
  {
    const h = await fetchWithVercelBypass(`${WEB}/api/health`).catch(() => null);
    if (!h || !h.ok) {
      log("server_available", false, { message: "WEB_URL indisponível" });
      process.exitCode = 2;
      printSummary();
      return;
    }
    log("server_available", true, { endpoint: `${WEB}/api/health`, status: h.status });
  }

  // 1. cliente
  {
    const reg = await registerClient(clientEmail, suffix);
    assert(
      reg.status === 201,
      `register client → ${reg.status} ${JSON.stringify(reg.data?.error ?? reg.data)}`
    );
    const u = await prisma.user.findUnique({ where: { email: clientEmail } });
    clientId = u?.id;
    log("1_auth_client", true, { method: "POST", endpoint: "/api/auth/register", status: reg.status, entity: clientId });
  }

  // 2. parceiro pendente + bloqueio
  {
    const reg = await registerPartner(partnerEmail, String(Number(suffix) + 1));
    assert(reg.status === 201, `register partner → ${reg.status}`);
    await login(partnerEmail);
    const blocked = await req("/api/partner/products", {
      method: "POST",
      body: JSON.stringify({
        name: "Bloqueado",
        description: "Parceiro pendente",
        catalogCategory: "FOOD",
        price: 10,
        stock: 1,
      }),
    });
    assert(blocked.status === 403, `pending → ${blocked.status}`);
    log("2_3_pending_partner_403", true, {
      method: "POST",
      endpoint: "/api/partner/products",
      status: blocked.status,
    });
  }

  // 4. aprovar
  {
    const partner = await approvePartner(partnerEmail);
    partnerId = partner.id;
    log("4_approve_partner", true, { partnerId });
  }

  // 5-6 produto
  {
    await login(partnerEmail);
    const created = await req("/api/partner/products", {
      method: "POST",
      body: JSON.stringify({
        name: `Ração Fase21 ${suffix}`,
        description: "Produto comercial mínimo",
        catalogCategory: "FOOD",
        price: 40,
        stock: 3,
        status: "ACTIVE",
      }),
    });
    assert(created.status === 201, `create product → ${created.status} ${JSON.stringify(created.data)}`);
    productId = unwrap(created.data)?.product?.id;
    assert(productId, "productId missing");
    log("5_6_create_product", true, {
      method: "POST",
      endpoint: "/api/partner/products",
      status: created.status,
      productId,
      ms: created.ms,
    });
  }

  // negativo: produto alheio
  {
    const regB = await registerPartner(partnerBEmail, String(Number(suffix) + 3));
    assert(regB.status === 201, `partner B register → ${regB.status}`);
    await approvePartner(partnerBEmail);
    await login(partnerBEmail);
    const steal = await req(`/api/partner/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Hackeado", description: "Hack", catalogCategory: "FOOD", price: 1, stock: 1 }),
    });
    assert(steal.status === 403 || steal.status === 404, `product IDOR → ${steal.status}`);
    log("neg_product_foreign", true, {
      method: "PUT",
      endpoint: `/api/partner/products/${productId}`,
      status: steal.status,
    });
  }

  // 7. carrinho
  {
    await login(clientEmail);
    const add = await req("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    assert(add.status === 200 || add.status === 201, `add cart → ${add.status}`);
    const cart = unwrap(add.data)?.cart || unwrap(add.data);
    const unit = cart?.items?.[0]?.unitPrice ?? cart?.items?.[0]?.unitPriceSnapshot;
    log("7_add_to_cart", true, {
      method: "POST",
      endpoint: "/api/cart/items",
      status: add.status,
      serverUnitPrice: unit,
    });
  }

  // 8. checkout + preço manipulado ignorado
  {
    const checkout = await req("/api/checkout", {
      method: "POST",
      headers: { "Idempotency-Key": `fase21-${suffix}` },
      body: JSON.stringify({
        deliveryMethod: "PICKUP_LOCAL",
        paymentMethod: "PIX",
        phone: phoneE164(suffix),
        address: { street: "Rua Cliente", city: "São Paulo", state: "SP" },
        total: 0.01,
        unitPrice: 0.01,
        platformFee: 0,
        partnerAmount: 999,
      }),
    });
    assert(
      checkout.status === 201 || checkout.status === 200,
      `checkout → ${checkout.status} ${JSON.stringify(checkout.data)}`
    );
    const order = unwrap(checkout.data)?.order;
    assert(order?.id, "order missing");
    orderId = order.id;
    assert(Number(order.total) === 40, `server total expected 40 got ${order.total}`);
    assert(order.status === "PENDING_CONFIRMATION", `status ${order.status}`);
    log("8_checkout_price_server", true, {
      method: "POST",
      endpoint: "/api/checkout",
      status: checkout.status,
      orderId,
      total: order.total,
      statusOrder: order.status,
      clientPriceIgnored: true,
    });

    // idempotência
    const again = await req("/api/checkout", {
      method: "POST",
      headers: { "Idempotency-Key": `fase21-${suffix}` },
      body: JSON.stringify({
        deliveryMethod: "PICKUP_LOCAL",
        paymentMethod: "PIX",
        phone: phoneE164(suffix),
        address: { street: "Rua Cliente", city: "São Paulo", state: "SP" },
      }),
    });
    const againOrder = unwrap(again.data)?.order;
    assert(againOrder?.id === orderId, "idempotency should return same order");
    log("8b_checkout_idempotency", true, { orderId, status: again.status });
  }

  // DB: snapshot + payment PENDING
  {
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
    assert(dbOrder.userId === clientId, "order user mismatch");
    assert(dbOrder.partnerId === partnerId, "order partner mismatch");
    assert(dbOrder.status === OrderStatus.PENDING_CONFIRMATION, "initial order status");
    assert(Number(dbOrder.grossAmount) === 40, "grossAmount");
    assert(Number(dbOrder.platformFeeAmount) >= 0, "platformFeeAmount");
    assert(Number(dbOrder.partnerAmount) > 0, "partnerAmount");
    assert(dbOrder.pricingVersion, "pricingVersion");
    assert(dbOrder.items.length === 1, "items");
    assert(dbOrder.items[0].partnerId === partnerId, "item partner");
    assert(Number(dbOrder.items[0].price) === 40, "item unit snapshot");
    assert(dbOrder.items[0].pricingVersion, "item pricingVersion");
    const pay = dbOrder.payments[0];
    assert(pay, "payment missing");
    assert(pay.status === "PENDING", `payment born ${pay.status}`);
    assert(pay.status !== "APPROVED" && pay.status !== "PAID", "payment must not be PAID at birth");
    paymentId = pay.id;

    const cart = await prisma.cart.findUnique({
      where: { userId: clientId },
      include: { items: true },
    });
    assert(!cart?.items?.length, "cart should be empty after checkout");

    const stock = await prisma.product.findUnique({ where: { id: productId } });
    assert(stock.stock === 2, `stock after checkout expected 2 got ${stock.stock}`);

    log("db_snapshot_and_pending_payment", true, {
      orderId,
      paymentId,
      pricingVersion: dbOrder.pricingVersion,
      platformFeeAmount: dbOrder.platformFeeAmount,
      partnerAmount: dbOrder.partnerAmount,
      cartItems: cart?.items?.length ?? 0,
      stock: stock.stock,
    });
  }

  // webhook inválido (HTTP) — assinatura falsa ou secret ausente → rejeição
  {
    const before = await prisma.order.findUnique({ where: { id: orderId } });
    const resourceId = `mp_test_${orderId}`;
    const body = JSON.stringify({
      id: Number(suffix.slice(-6)) || 1,
      type: "order",
      action: "order.processed",
      data: { id: resourceId },
      live_mode: false,
    });
    const wh = await req("/api/webhooks/mercado-pago", {
      method: "POST",
      noCookie: true,
      headers: {
        "Content-Type": "application/json",
        "x-signature": `ts=${Date.now()},v1=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef`,
        "x-request-id": `bad-${suffix}`,
      },
      body,
    });
    assert(wh.status >= 400, `invalid webhook should reject → ${wh.status}`);
    const after = await prisma.order.findUnique({ where: { id: orderId } });
    assert(after.status === before.status, "invalid webhook must not change order");
    log("neg_webhook_invalid_signature", true, {
      method: "POST",
      endpoint: "/api/webhooks/mercado-pago",
      status: wh.status,
      orderUnchanged: after.status,
      code: unwrap(wh.data)?.error?.code || wh.data?.error?.code,
    });
  }

  // valor divergente (não confirma)
  {
    const bad = await applyPaid({
      paymentId,
      orderId,
      amount: 40,
      eventId: `evt_divergent_${orderId}`,
      receivedAmount: 1.23,
    });
    assert(bad.changed === false, "divergent amount must not change");
    const o = await prisma.order.findUnique({ where: { id: orderId } });
    assert(o.status === OrderStatus.PENDING_CONFIRMATION, "still pending after divergent");
    log("neg_webhook_divergent_amount", true, {
      changed: bad.changed,
      orderStatus: o.status,
    });
  }

  // 9-11 pagamento autorizado (webhook source server-side)
  {
    const r1 = await applyPaid({
      paymentId,
      orderId,
      amount: 40,
      eventId: `evt_ok_${orderId}`,
      receivedAmount: 40,
    });
    assert(r1.changed === true, "first approved should change");
    const paid = await prisma.order.findUnique({ where: { id: orderId } });
    assert(paid.status === OrderStatus.PAID, `expected PAID got ${paid.status}`);
    const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
    assert(pay.status === "APPROVED", `payment ${pay.status}`);
    log("9_10_11_paid_via_authorized_webhook_source", true, {
      orderStatus: paid.status,
      paymentStatus: pay.status,
      previous: "PENDING_CONFIRMATION",
    });

    // duplicado
    const r2 = await applyPaid({
      paymentId,
      orderId,
      amount: 40,
      eventId: `evt_ok_${orderId}_dup`,
      receivedAmount: 40,
    });
    assert(r2.changed === false, "duplicate approved must be no-op");
    log("neg_webhook_duplicate", true, { changed: r2.changed });
  }

  // audit + notifications
  {
    const audits = await prisma.auditLog.count({
      where: {
        OR: [
          { resourceId: orderId },
          { resourceId: paymentId },
          { module: { contains: "commerce" } },
        ],
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    const notifs = await prisma.notification.count({
      where: {
        OR: [{ userId: clientId }, { userId: partnerId }],
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    log("audit_and_notifications", audits > 0 || notifs > 0, {
      auditCountRecent: audits,
      notificationCountRecent: notifs,
    });
  }

  // 12 parceiro vê
  {
    await login(partnerEmail);
    const list = await req("/api/partner/orders");
    assert(list.status === 200, `partner orders → ${list.status}`);
    const orders = unwrap(list.data)?.orders || [];
    assert(orders.some((o) => o.id === orderId), "partner must see order");
    log("12_partner_sees_order", true, { status: list.status });
  }

  // 13 partner preparing + bloqueio financeiro
  {
    await login(partnerEmail);
    const prep = await req(`/api/partner/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PREPARING" }),
    });
    assert(prep.status === 200, `preparing → ${prep.status} ${JSON.stringify(prep.data)}`);
    log("13_partner_processing", true, { status: prep.status, next: "PREPARING" });

    const finance = await req(`/api/partner/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PAID" }),
    });
    assert(finance.status === 403, `partner PAID → ${finance.status}`);
    log("neg_partner_set_paid", true, { status: finance.status });
  }

  // 14 cliente acompanha
  {
    await login(clientEmail);
    const mine = await req(`/api/client/orders/${orderId}`);
    assert(mine.status === 200, `client order → ${mine.status}`);
    log("14_client_tracks", true, { status: mine.status });
  }

  // IDOR cliente B
  {
    const reg = await registerClient(clientBEmail, String(Number(suffix) + 2));
    assert(reg.status === 201, `client B → ${reg.status}`);
    await login(clientBEmail);
    const idor = await req(`/api/client/orders/${orderId}`);
    assert(idor.status === 404 || idor.status === 403, `IDOR → ${idor.status}`);
    log("neg_order_foreign", true, { status: idor.status });
  }

  // Express 410 (se disponível)
  {
    try {
      const er = await fetch(`${EXPRESS}/api/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [] }),
      });
      const body = await er.json().catch(() => ({}));
      const ok410 = er.status === 410 || body?.error?.code === "COMMERCIAL_API_MOVED";
      if (er.status === 401 || er.status === 403) {
        // auth middleware before block — still not mutating; try cart
        const er2 = await fetch(`${EXPRESS}/api/cart/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: 1 }),
        });
        const ok =
          er2.status === 410 ||
          er2.status === 401 ||
          er2.status === 403;
        log(
          "neg_express_legacy",
          er2.status === 410,
          {
            endpoint: `${EXPRESS}/api/cart/items`,
            status: er2.status,
            note:
              er2.status === 410
                ? "410 confirmed"
                : "Express up but auth before 410 — start with session or mark partial",
          },
          er2.status === 410
        );
        if (er2.status !== 410) {
          // also verify Next proxy does not silently succeed commercial Express
          const proxy = await req("/api/ecopet/orders/checkout", {
            method: "POST",
            body: JSON.stringify({ items: [] }),
          });
          log(
            "neg_express_proxy_no_silent_success",
            proxy.status === 503 || proxy.status === 410 || proxy.status >= 400,
            { status: proxy.status },
            false
          );
        }
      } else {
        log("neg_express_legacy", ok410, {
          endpoint: `${EXPRESS}/api/orders/checkout`,
          status: er.status,
          code: body?.error?.code,
        });
      }
    } catch (e) {
      // Express é opcional no E2E Preview (Next-only). Indisponível ≠ falha.
      log(
        "neg_express_legacy",
        true,
        { message: `EXPRESS_URL indisponível: ${e.message}`, skipped: true },
        false
      );
      // Soft: also assert Next commercial path works without Express
      const proxy = await req("/api/ecopet/cart", { method: "GET" });
      log(
        "neg_express_proxy_degraded",
        proxy.status === 503 || proxy.status >= 400,
        { status: proxy.status, note: "sem Express — proxy não deve mutar" },
        false
      );
    }
  }

  // cancelamento permitido em pedido separado (pré-pagamento)
  {
    await login(clientEmail);
    await req("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const c2 = await req("/api/checkout", {
      method: "POST",
      headers: { "Idempotency-Key": `fase21-cancel-${suffix}` },
      body: JSON.stringify({
        deliveryMethod: "PICKUP_LOCAL",
        paymentMethod: "PIX",
        phone: phoneE164(suffix),
        address: { street: "Rua Cancel", city: "São Paulo", state: "SP" },
      }),
    });
    const o2 = unwrap(c2.data)?.order;
    assert(o2?.id, "cancel-order missing");
    const cancel = await req(`/api/client/orders/${o2.id}/cancel`, { method: "PATCH", body: "{}" });
    assert(cancel.status === 200, `cancel → ${cancel.status} ${JSON.stringify(cancel.data)}`);
    const db = await prisma.order.findUnique({ where: { id: o2.id } });
    assert(db.status === OrderStatus.CANCELLED, `cancel status ${db.status}`);
    log("16_cancel_before_payment", true, {
      orderId: o2.id,
      status: db.status,
      endpoint: `/api/client/orders/${o2.id}/cancel`,
    });
  }

  // refund request (sandbox path — may be 200 request or 400 rule)
  {
    await login(clientEmail);
    const refund = await req(`/api/orders/${orderId}/refund`, {
      method: "POST",
      body: JSON.stringify({ reason: "Homologacao sandbox fase 2.1" }),
    });
    const ok = refund.status === 200 || refund.status === 201 || refund.status === 400;
    log("17_refund_request", ok, {
      status: refund.status,
      note: "não marca REFUNDED só por chamar API",
    });
  }

  // export ids for restart test
  console.log(
    `\nFASE21_ORDER_ID=${orderId}\nFASE21_PAYMENT_ID=${paymentId}\nFASE21_PRODUCT_ID=${productId}\nFASE21_CLIENT_EMAIL=${clientEmail}\n`
  );

  printSummary();
}

function printSummary() {
  const failedRequired = results.filter((r) => r.required && !r.ok);
  const failedOptional = results.filter((r) => !r.required && !r.ok);
  console.log(
    `\n=== Resultado: ${results.filter((r) => r.ok).length}/${results.length} ok | required fails: ${failedRequired.length} | optional fails: ${failedOptional.length} | ${Date.now() - startedAt}ms ===`
  );
  if (failedRequired.length) {
    console.error("REQUIRED FAILURES:", failedRequired);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
    printSummary();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
