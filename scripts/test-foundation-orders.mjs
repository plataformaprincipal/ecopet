/**
 * Testes Etapa 8 — Pedidos
 */
import { PrismaClient, AccountStatus, ProductCatalogStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";

function assert(c, m) { if (!c) throw new Error(m); }
function phone(s) { return `119${String(s).padStart(8, "0").slice(-8)}`; }

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (jar.get("c")) headers.Cookie = jar.get("c");
  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  if (sc?.includes("ecopet-session")) jar.set("c", sc.split(";")[0]);
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function main() {
  const ts = Date.now();
  const clientEmail = `client.order.${ts}@test.ecopet.local`;
  jar.clear();
  await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT", name: "Cliente", email: clientEmail, password: pwd, confirmPassword: pwd,
      phone: phone(ts), birthDate: "1990-01-01",
    }),
  });

  const product = await prisma.product.findFirst({
    where: { status: ProductCatalogStatus.ACTIVE, approvalStatus: "APPROVED", stock: { gt: 1 }, deletedAt: null },
  });
  assert(product, "produto com estoque");

  await req("/api/cart/items", { method: "POST", body: JSON.stringify({ productId: product.id, quantity: 1 }) });

  const stockBefore = product.stock;
  const checkout = await req("/api/checkout", {
    method: "POST",
    body: JSON.stringify({
      deliveryMethod: "PICKUP_LOCAL",
      phone: phone(ts + 1),
      address: { street: "Rua A", city: "São Paulo", state: "SP" },
    }),
  });
  assert(checkout.status === 201 || checkout.status === 200, "checkout creates order");

  const after = await prisma.product.findUnique({ where: { id: product.id } });
  assert(after && after.stock < stockBefore, "stock reduced");

  const orders = await req("/api/client/orders");
  assert(orders.data.data.orders?.length >= 1, "client sees orders");

  const orderId = orders.data.data.orders[0].id;
  const cancel = await req(`/api/client/orders/${orderId}/cancel`, { method: "PATCH" });
  assert(cancel.status === 200, "client cancels pending order");

  console.log("✓ test:foundation:orders passou");
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
