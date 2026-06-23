/**
 * Testes Etapa 8 — Pedidos (cliente + parceiro + isolamento)
 */
import { PrismaClient, ProductCatalogStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";

function assert(c, m) { if (!c) throw new Error(m); }
function phone(s) { return `119${String(s).padStart(8, "0").slice(-8)}`; }
function cnpj() { return String(Date.now()).slice(-10).padEnd(14, "0").slice(0, 14); }

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (jar.get("c")) headers.Cookie = jar.get("c");
  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  if (sc?.includes("ecopet-session")) jar.set("c", sc.split(";")[0]);
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function registerPartner(email, suffix) {
  jar.clear();
  const reg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER", name: "Loja Pedido", email, password: pwd, confirmPassword: pwd,
      phone: phone(suffix), businessName: "Loja", legalName: "Loja LTDA", cnpj: cnpj(),
      category: "Pet Shop", address: "Rua A", city: "SP", state: "SP",
    }),
  });
  assert(reg.status === 201, "register partner");
}

async function login(email) {
  jar.clear();
  const r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: pwd }) });
  assert(r.status === 200, `login ${email}`);
}

async function main() {
  const ts = Date.now();
  const partnerEmail = `partner.order.${ts}@test.ecopet.local`;
  const clientEmail = `client.order.${ts}@test.ecopet.local`;
  const otherPartnerEmail = `other.order.${ts}@test.ecopet.local`;

  await registerPartner(partnerEmail, ts);
  const create = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({
      name: `Pedido Flow ${ts}`, description: "Produto E2E", shortDescription: "E2E",
      catalogCategory: "FOOD", price: 55, stock: 10, status: "ACTIVE",
    }),
  });
  assert(create.status === 201, "parceiro cria produto");
  const productId = create.data.data.product.id;
  const partnerId = create.data.data.product.sellerId;

  jar.clear();
  await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT", name: "Cliente Teste", email: clientEmail, password: pwd, confirmPassword: pwd,
      phone: phone(ts + 1), birthDate: "1990-01-01", username: `ord${ts}`, gender: "MASCULINO", acceptTerms: true, acceptPrivacy: true,
    }),
  });

  await req("/api/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity: 1 }) });

  const stockBefore = create.data.data.product.stock;
  const checkout = await req("/api/checkout", {
    method: "POST",
    body: JSON.stringify({
      deliveryMethod: "PICKUP_LOCAL",
      paymentMethod: "PIX",
      phone: phone(ts + 2),
      address: { street: "Rua A", city: "São Paulo", state: "SP" },
    }),
  });
  assert(checkout.status === 201 || checkout.status === 200, "checkout creates order");
  const orderId = checkout.data.data?.order?.id;
  assert(orderId, "order id returned");

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

main().catch((e) => { console.error("✗", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
