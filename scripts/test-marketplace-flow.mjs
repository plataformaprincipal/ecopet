/**
 * Fluxo E2E marketplace — critérios de aceite parceiro → cliente → pedido/agendamento
 * Requer servidor em WEB_URL (ex.: npm run dev) e PostgreSQL acessível.
 */
import { PrismaClient } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";

function assert(c, m) {
  if (!c) throw new Error(m);
}
function phone(s) {
  return `119${String(s).padStart(8, "0").slice(-8)}`;
}
function cnpj() {
  return String(Date.now()).slice(-10).padEnd(14, "0").slice(0, 14);
}

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
      role: "PARTNER",
      name: "Loja Flow",
      email,
      password: pwd,
      confirmPassword: pwd,
      phone: phone(suffix),
      businessName: "Loja Flow",
      legalName: "Loja Flow LTDA",
      cnpj: cnpj(),
      category: "Pet Shop",
      address: "Rua A",
      city: "SP",
      state: "SP",
    }),
  });
  assert(reg.status === 201, "parceiro registra");
  return reg;
}

async function registerClient(email, suffix, username) {
  jar.clear();
  const reg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Flow",
      email,
      password: pwd,
      confirmPassword: pwd,
      phone: phone(suffix),
      birthDate: "1990-01-01",
      username,
      gender: "MASCULINO",
      acceptTerms: true,
      acceptPrivacy: true,
    }),
  });
  assert(reg.status === 201, "cliente registra");
}

async function login(email) {
  jar.clear();
  const r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: pwd }) });
  assert(r.status === 200, `login ${email}`);
}

function tomorrowAt(hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return { iso: d.toISOString(), weekday: d.getDay() };
}

async function main() {
  const ts = Date.now();
  const partnerEmail = `flow.partner.${ts}@test.ecopet.local`;
  const clientEmail = `flow.client.${ts}@test.ecopet.local`;
  const otherPartnerEmail = `flow.other.${ts}@test.ecopet.local`;

  console.log("→ Produto: parceiro cria → público vê → cliente compra → parceiro recebe");

  await registerPartner(partnerEmail, ts);
  const productRes = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({
      name: `Flow Product ${ts}`,
      description: "E2E flow",
      catalogCategory: "FOOD",
      price: 42,
      stock: 5,
      status: "ACTIVE",
    }),
  });
  assert(productRes.status === 201, "parceiro cria produto");
  const productId = productRes.data.data.product.id;

  jar.clear();
  const publicList = await req("/api/products");
  assert(publicList.status === 200, "GET /api/products");
  assert(
    publicList.data.data?.products?.some((p) => p.id === productId),
    "produto visível no catálogo público"
  );

  const publicDetail = await req(`/api/products/${productId}`);
  assert(publicDetail.status === 200, "GET /api/products/:id");

  const guestCart = await req("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  assert(guestCart.status === 401, "visitante não adiciona ao carrinho");

  await registerClient(clientEmail, ts + 1, `flow${ts}`);
  await req("/api/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity: 1 }) });

  const checkout = await req("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      deliveryMethod: "PICKUP_LOCAL",
      paymentMethod: "PIX",
      phone: phone(ts + 2),
      address: { street: "Rua A", city: "São Paulo", state: "SP" },
    }),
  });
  assert(checkout.status === 201 || checkout.status === 200, "POST /api/orders (checkout)");
  const orderId = checkout.data.data?.order?.id;
  assert(orderId, "pedido criado");

  const myOrders = await req("/api/orders/me");
  assert(myOrders.data.data.orders?.some((o) => o.id === orderId), "GET /api/orders/me");

  await login(partnerEmail);
  const partnerOrders = await req("/api/partner/orders");
  assert(partnerOrders.data.data.orders?.some((o) => o.id === orderId), "parceiro vê pedido");

  const delBlocked = await req(`/api/partner/products/${productId}`, { method: "DELETE" });
  assert(delBlocked.status === 409, "não exclui produto com pedido");

  await registerPartner(otherPartnerEmail, ts + 9);
  const foreignEdit = await req(`/api/partner/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ name: "Hack" }),
  });
  assert(foreignEdit.status === 404, "parceiro não edita produto de outro");

  await login(partnerEmail);
  const svcRes = await req("/api/partner/services", {
    method: "POST",
    body: JSON.stringify({
      name: `Flow Service ${ts}`,
      description: "Banho E2E",
      category: "BATH_GROOMING",
      price: 60,
      durationMin: 60,
      status: "ACTIVE",
    }),
  });
  assert(svcRes.status === 201, "parceiro cria serviço");
  const serviceId = svcRes.data.data.service.id;

  const slotDay = tomorrowAt(11);
  await req("/api/partner/availability", {
    method: "PUT",
    body: JSON.stringify({
      slots: [{ weekday: slotDay.weekday, startTime: "08:00", endTime: "18:00", intervalMinutes: 30 }],
    }),
  });

  jar.clear();
  const publicSvc = await req(`/api/services/${serviceId}`);
  assert(publicSvc.status === 200, "GET /api/services/:id");

  await login(clientEmail);
  const petRes = await req("/api/client/pets", {
    method: "POST",
    body: JSON.stringify({ name: "Rex", species: "DOG", breed: "SRD" }),
  });
  const petId = petRes.data.data?.pet?.id ?? petRes.data.data?.id;
  assert(petId, "cliente tem pet");

  const appt = await req("/api/appointments", {
    method: "POST",
    body: JSON.stringify({
      petId,
      serviceId,
      startAt: slotDay.iso,
      notes: "E2E",
    }),
  });
  assert(appt.status === 201, "POST /api/appointments");
  const appointmentId = appt.data.data?.appointment?.id;
  assert(appointmentId, "agendamento criado");

  const myAppts = await req("/api/appointments/me");
  assert(myAppts.data.data.appointments?.some((a) => a.id === appointmentId), "GET /api/appointments/me");

  await login(partnerEmail);
  const partnerAppts = await req("/api/partner/appointments");
  assert(
    partnerAppts.data.data.appointments?.some((a) => a.id === appointmentId),
    "parceiro vê agendamento"
  );

  const confirm = await req(`/api/partner/appointments/${appointmentId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  assert(confirm.status === 200, "parceiro confirma agendamento (PUT)");

  await login(clientEmail);
  const clientDash = await req("/api/auth/me");
  assert(clientDash.data.data?.user?.role === "CLIENT", "cliente autenticado");
  const partnerDash = await req("/api/partner/orders");
  assert(partnerDash.status === 403 || partnerDash.status === 401, "cliente não acessa API parceiro");

  console.log("✓ test:marketplace-flow — fluxo completo validado");
}

main()
  .catch((e) => {
    console.error("✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
