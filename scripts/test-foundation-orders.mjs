/**
 * Testes Etapa 8 — Pedidos (cliente + parceiro + isolamento)
 */
import { PrismaClient } from "@prisma/client";
import { generateValidCnpj } from "./cnpj-test-utils.mjs";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";
const TEST_RUN_IP_BASE = `10.255.${Date.now() % 200}`;
let reqSeq = 0;

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

async function resetAuthRateLimit() {
  try {
    await fetch(`${WEB}/api/auth/test/reset-rate-limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    /* optional */
  }
}

async function req(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": opts.testIp ?? nextTestIp(),
    ...(opts.headers || {}),
  };
  if (jar.get("c")) headers.Cookie = jar.get("c");
  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  const setCookies =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : sc ? [sc] : [];
  for (const raw of setCookies) {
    const session = raw.split(";")[0];
    if (session.includes("ecopet-session=")) jar.set("c", session);
  }
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function registerPartner(email, suffix) {
  jar.clear();
  const reg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      name: "Loja Pedido",
      email,
      password: pwd,
      confirmPassword: pwd,
      phone: phoneE164(suffix),
      businessName: "Loja Pedido",
      legalName: "Loja Pedido LTDA",
      cnpj: generateValidCnpj(suffix),
      category: "Pet Shop",
      address: "Rua A, 100",
      city: "São Paulo",
      state: "SP",
      acceptTerms: true,
      acceptPrivacy: true,
    }),
  });
  assert(
    reg.status === 201,
    `register partner → ${reg.status} ${JSON.stringify(reg.data?.error ?? reg.data)}`
  );
}

async function login(email) {
  jar.clear();
  const r = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: pwd }),
  });
  assert(r.status === 200, `login ${email} → ${r.status}`);
}

async function main() {
  await resetAuthRateLimit();

  const ts = Date.now();
  const partnerEmail = `partner.order.${ts}@test.ecopet.local`;
  const clientEmail = `client.order.${ts}@test.ecopet.local`;
  const otherPartnerEmail = `other.order.${ts}@test.ecopet.local`;

  await registerPartner(partnerEmail, ts);
  const create = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({
      name: `Pedido Flow ${ts}`,
      description: "Produto E2E",
      shortDescription: "E2E",
      catalogCategory: "FOOD",
      price: 55,
      stock: 10,
      status: "ACTIVE",
    }),
  });
  assert(
    create.status === 201,
    `parceiro cria produto → ${create.status} ${JSON.stringify(create.data?.error ?? create.data)}`
  );
  const productId = create.data.data.product.id;

  jar.clear();
  const clientReg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Teste",
      email: clientEmail,
      password: pwd,
      confirmPassword: pwd,
      phone: phoneE164(ts + 1),
      birthDate: "1990-01-01",
      username: `ord${String(ts).slice(-10)}`,
      gender: "MASCULINO",
      acceptTerms: true,
      acceptPrivacy: true,
    }),
  });
  assert(
    clientReg.status === 201,
    `register client → ${clientReg.status} ${JSON.stringify(clientReg.data?.error ?? clientReg.data)}`
  );

  await req("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity: 1 }),
  });

  const stockBefore = create.data.data.product.stock;
  const checkout = await req("/api/checkout", {
    method: "POST",
    body: JSON.stringify({
      deliveryMethod: "PICKUP_LOCAL",
      paymentMethod: "PIX",
      phone: phoneE164(ts + 2),
      address: { street: "Rua A", city: "São Paulo", state: "SP" },
    }),
  });
  assert(
    checkout.status === 201 || checkout.status === 200,
    `checkout creates order → ${checkout.status} ${JSON.stringify(checkout.data?.error ?? checkout.data)}`
  );
  const order = checkout.data.data?.order;
  const orderId = order?.id;
  assert(orderId, "order id returned");
  // Sem gateway: não marcar como pago mesmo com paymentMethod PIX no formulário
  if (order?.paymentStatus) {
    assert(
      order.paymentStatus !== "PAID" && order.paymentStatus !== "APPROVED",
      `pedido não deve estar pago sem gateway (got ${order.paymentStatus})`
    );
  }

  const after = await prisma.product.findUnique({ where: { id: productId } });
  assert(after && after.stock < stockBefore, "stock reduced");

  const orders = await req("/api/client/orders");
  assert(orders.data.data.orders?.some((o) => o.id === orderId), "client sees order");

  await login(partnerEmail);
  const partnerOrders = await req("/api/partner/orders");
  assert(partnerOrders.data.data.orders?.some((o) => o.id === orderId), "parceiro vê pedido");

  const confirm = await req(`/api/partner/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  assert(confirm.status === 200, "parceiro confirma pedido");

  await login(clientEmail);
  const clientDetail = await req("/api/client/orders");
  const updated = clientDetail.data.data.orders.find((o) => o.id === orderId);
  assert(updated?.status === "CONFIRMED", "cliente vê status atualizado");

  await registerPartner(otherPartnerEmail, ts + 9);
  const foreign = await req(`/api/partner/orders/${orderId}`);
  assert(foreign.status === 404, "outro parceiro não vê pedido");

  await login(clientEmail);
  const cancel = await req(`/api/client/orders/${orderId}/cancel`, { method: "PATCH" });
  assert(cancel.status === 400, "cliente não cancela após confirmação");

  console.log("✓ test:foundation:orders passou");
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error("✗", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
