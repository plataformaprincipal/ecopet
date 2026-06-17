/**
 * Testes — Bootstrap do catálogo institucional EcoPet
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient, ProductCatalogStatus } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";

const CATALOG_EMAIL = "catalogo@ecopet.local";
const PRODUCT_SKUS = [
  "ECOPET-ACC-CAMISA",
  "ECOPET-ACC-BRINQUEDO",
  "ECOPET-ACC-CAMA",
  "ECOPET-FOOD-CAO-10KG",
  "ECOPET-FOOD-GATO-3KG",
  "ECOPET-HIG-TAPETE",
  "ECOPET-HIG-FRALDA",
];

function assert(c, m) {
  if (!c) throw new Error(m);
}

function runBootstrap() {
  execSync("node scripts/bootstrap-catalog.mjs", { cwd: root, stdio: "pipe", env: process.env });
}

async function req(pathname, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (jar.get("c")) headers.Cookie = jar.get("c");
  const res = await fetch(`${WEB}${pathname}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  if (sc?.includes("ecopet-session")) jar.set("c", sc.split(";")[0]);
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function main() {
  console.log("=== test:foundation:catalog ===\n");

  runBootstrap();
  const partner = await prisma.user.findUnique({
    where: { email: CATALOG_EMAIL },
    include: { partnerProfile: true },
  });
  assert(partner, "bootstrap cria EcoPet Oficial");
  assert(partner.role === "PARTNER", "parceiro institucional é PARTNER");
  assert(partner.accountStatus === "ACTIVE", "parceiro ACTIVE");
  assert(partner.isBootstrapUser, "marcado isBootstrapUser");

  const products = await prisma.product.findMany({
    where: { sellerId: partner.id, sku: { in: PRODUCT_SKUS }, deletedAt: null },
  });
  assert(products.length === 7, `bootstrap cria 7 produtos (got ${products.length})`);
  assert(products.every((p) => p.status === ProductCatalogStatus.ACTIVE), "produtos ACTIVE");
  assert(products.every((p) => p.approvalStatus === "APPROVED"), "produtos APPROVED");
  assert(products.every((p) => Array.isArray(p.images) && p.images.length > 0), "produtos com imagem");
  assert(
    products.every((p) => typeof p.images[0] === "string" && p.images[0].startsWith("/catalog/")),
    "imagens locais do catálogo"
  );
  assert(
    products.every((p) => {
      const extra = p.extraDetails;
      return extra && typeof extra === "object" && extra.imageAlt;
    }),
    "produtos com alt descritivo"
  );

  const services = await prisma.service.findMany({
    where: { providerId: partner.id, deletedAt: null, status: "ACTIVE" },
  });
  assert(services.length >= 2, "bootstrap cria 2 serviços");
  assert(services.some((s) => s.name === "Banho Pet"), "serviço Banho Pet");
  assert(services.some((s) => s.name === "Tosa Pet"), "serviço Tosa Pet");
  assert(services.every((s) => s.image && s.image.startsWith("/catalog/")), "serviços com imagem local");
  assert(
    services.every((s) => {
      const extra = s.extraDetails;
      return extra && typeof extra === "object" && extra.imageAlt;
    }),
    "serviços com alt descritivo"
  );
  assert(services.find((s) => s.name === "Banho Pet")?.durationMin === 60, "Banho 60 min");
  assert(services.find((s) => s.name === "Tosa Pet")?.durationMin === 90, "Tosa 90 min");

  const avail = await prisma.partnerAvailability.count({ where: { partnerId: partner.id } });
  assert(avail === 6, "disponibilidade seg–sáb");

  const countBefore = await prisma.product.count({ where: { sellerId: partner.id } });
  runBootstrap();
  const countAfter = await prisma.product.count({ where: { sellerId: partner.id } });
  assert(countBefore === countAfter, "bootstrap duas vezes não duplica produtos");

  const pubProducts = await req("/api/public/products");
  assert(pubProducts.data.data?.products?.length >= 7, "usuário vê produtos públicos");

  const pubServices = await req("/api/public/services");
  assert(pubServices.data.data?.services?.length >= 2, "usuário vê serviços públicos");

  const loginBlocked = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: CATALOG_EMAIL, password: "qualquer" }),
  });
  assert(loginBlocked.status === 403 || loginBlocked.status === 401, "login institucional bloqueado");

  const ts = Date.now();
  const clientEmail = `client.catalog.${ts}@test.ecopet.local`;
  jar.clear();
  const reg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Catálogo",
      email: clientEmail,
      password: pwd,
      confirmPassword: pwd,
      phone: `119${String(ts).slice(-8)}`,
      birthDate: "1990-01-01",
    }),
  });
  assert(reg.status === 201, "cliente cadastra");

  const product = products[0];
  const addCart = await req("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  assert(addCart.status === 200 || addCart.status === 201, "cliente adiciona ao carrinho");

  const checkout = await req("/api/checkout", {
    method: "POST",
    body: JSON.stringify({
      deliveryMethod: "PICKUP_LOCAL",
      phone: "11999999999",
      address: { street: "Rua Teste", city: "São Paulo", state: "SP" },
    }),
  });
  assert(checkout.status === 200 || checkout.status === 201, "checkout cria pedido");

  const orders = await req("/api/client/orders");
  assert(orders.data.data?.orders?.length >= 1, "pedido no painel cliente");

  const banho = services.find((s) => s.name === "Banho Pet");
  const pet = await req("/api/client/pets", {
    method: "POST",
    body: JSON.stringify({ name: "Rex", species: "DOG" }),
  });
  assert(pet.status === 201, "cliente cadastra pet");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  while (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
  const dateIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaySlots = await req(`/api/public/services/${banho.id}/availability?date=${todayIso}`);
  assert((todaySlots.data.data?.slots?.length ?? 0) === 0, "hoje sem slots");

  const slots = await req(`/api/public/services/${banho.id}/availability?date=${dateIso}`);
  assert(slots.data.data?.slots?.length > 0, "horários disponíveis a partir de amanhã");
  assert(slots.data.data?.durationMin === 60, "Banho slots 60 min");

  const tosa = services.find((s) => s.name === "Tosa Pet");
  const tosaSlots = await req(`/api/public/services/${tosa.id}/availability?date=${dateIso}`);
  assert(tosaSlots.data.data?.slots?.length > 0, "Tosa com horários amanhã");
  assert(tosaSlots.data.data?.durationMin === 90, "Tosa slots 90 min");

  const slot = slots.data.data.slots[0];
  const bookTele = await req("/api/client/appointments", {
    method: "POST",
    body: JSON.stringify({
      petId: pet.data.data.pet.id,
      serviceId: banho.id,
      startAt: slot,
      attendanceMode: "TELEBUSCA",
      pickupAddress: "Rua Teste, 100",
      pickupPhone: "11999999999",
    }),
  });
  assert(bookTele.status === 201, "agendamento Tele-busca");

  const bookDup = await req("/api/client/appointments", {
    method: "POST",
    body: JSON.stringify({
      petId: pet.data.data.pet.id,
      serviceId: banho.id,
      startAt: slot,
      attendanceMode: "TUTOR_DELIVERY",
    }),
  });
  assert(bookDup.status === 409, "duplicidade de horário bloqueada");

  const appts = await req("/api/client/appointments");
  assert(appts.data.data?.appointments?.length >= 1, "agendamento no painel cliente");

  console.log("\n✓ test:foundation:catalog passou");
}

main()
  .catch((e) => {
    console.error("✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
