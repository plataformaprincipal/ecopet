/**
 * Testes Etapa 8 — Carrinho (cliente autenticado; visitante bloqueado)
 */
import { PrismaClient, ProductCatalogStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";
const TEST_RUN_IP_BASE = `10.254.${Date.now() % 200}`;
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
  const cookies = [];
  if (jar.get("c")) cookies.push(jar.get("c"));
  if (jar.get("cart")) cookies.push(`ecopet-cart-session=${jar.get("cart")}`);
  if (cookies.length) headers.Cookie = cookies.join("; ");
  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  const setCookies =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : sc ? [sc] : [];
  for (const raw of setCookies) {
    const session = raw.split(";")[0];
    if (session.includes("ecopet-session=")) jar.set("c", session);
    if (raw.includes("ecopet-cart-session=")) {
      jar.set("cart", raw.match(/ecopet-cart-session=([^;]+)/)?.[1]);
    }
  }
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function loginClient(ts) {
  const email = `client.cart.${ts}@test.ecopet.local`;
  jar.clear();
  const reg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Cart",
      email,
      password: pwd,
      confirmPassword: pwd,
      phone: phoneE164(ts),
      birthDate: "1990-01-01",
      username: `crt${String(ts).slice(-10)}`,
      gender: "MASCULINO",
      acceptTerms: true,
      acceptPrivacy: true,
    }),
  });
  assert(
    reg.status === 201,
    `register client → ${reg.status} ${JSON.stringify(reg.data?.error ?? reg.data)}`
  );
  return email;
}

async function main() {
  await resetAuthRateLimit();

  const product = await prisma.product.findFirst({
    where: {
      status: ProductCatalogStatus.ACTIVE,
      approvalStatus: "APPROVED",
      stock: { gt: 2 },
      deletedAt: null,
    },
  });
  assert(product, "precisa de produto ACTIVE com estoque");

  jar.clear();
  const visitorAdd = await req("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  assert(visitorAdd.status === 401, "visitante não adiciona ao carrinho");

  const ts = Date.now();
  await loginClient(ts);

  const add = await req("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  assert(add.status === 200 || add.status === 201, `cliente adiciona ao carrinho → ${add.status}`);

  const itemId = add.data.data?.cart?.items?.[0]?.id;
  assert(itemId, "item no carrinho");

  const patch = await req(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity: 2 }),
  });
  assert(patch.status === 200, "cliente altera quantidade");

  const over = await req("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId: product.id, quantity: product.stock + 100 }),
  });
  assert(over.status === 400 || over.status === 409, "over stock blocked");

  const other = await prisma.product.findFirst({
    where: {
      id: { not: product.id },
      status: ProductCatalogStatus.ACTIVE,
      approvalStatus: "APPROVED",
      stock: { gt: 0 },
      sellerId: { not: product.sellerId },
    },
  });
  if (other) {
    const multi = await req("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId: other.id, quantity: 1 }),
    });
    assert(multi.status === 400 || multi.status === 409, "multi partner blocked");
  }

  console.log("✓ test:foundation:cart passou");
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
