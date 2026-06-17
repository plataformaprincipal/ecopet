/**
 * Testes Etapa — Serviços do parceiro (acesso imediato, sem aprovação admin)
 */
import { PrismaClient } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";

function assert(c, m) { if (!c) throw new Error(m); }
function cnpj() { return String(Date.now()).slice(-10).padEnd(14, "0").slice(0, 14); }
function phone(s) { return `119${String(s).padStart(8, "0").slice(-8)}`; }

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
      role: "PARTNER", name: "Prestador", email, password: pwd, confirmPassword: pwd,
      phone: phone(suffix), businessName: "Serviços Pet", legalName: "Serviços Pet LTDA", cnpj: cnpj(),
      category: "Pet Shop", address: "Rua A", city: "São Paulo", state: "SP",
    }),
  });
  assert(reg.status === 201, "register partner");
  assert(reg.data.data?.user?.accountStatus === "ACTIVE", "partner ACTIVE");
}

async function main() {
  const ts = Date.now();
  const partnerEmail = `partner.svc.${ts}@test.ecopet.local`;
  const clientEmail = `client.svc.${ts}@test.ecopet.local`;
  const ongEmail = `ong.svc.${ts}@test.ecopet.local`;

  await registerPartner(partnerEmail, ts);

  const create = await req("/api/partner/services", {
    method: "POST",
    body: JSON.stringify({
      name: "Banho Premium", description: "Banho completo para cães", shortDescription: "Banho e secagem",
      category: "BATH_GROOMING", price: 80, durationMin: 60, status: "ACTIVE",
      modality: "IN_PERSON", city: "São Paulo", state: "SP", speciesTarget: "DOG",
    }),
  });
  if (!create.data?.data?.service) {
    throw new Error(`criar serviço — status ${create.status} body ${JSON.stringify(create.data)}`);
  }
  assert(create.status === 201, "parceiro cria serviço");
  assert(create.data.data.service.status === "ACTIVE", "serviço ACTIVE na criação");
  assert(create.data.data.service.approvalStatus === "APPROVED", "serviço APPROVED na criação");
  const serviceId = create.data.data.service.id;

  const pubList = await req("/api/public/services");
  assert(pubList.data.data.services.some((s) => s.id === serviceId), "serviço aparece em /api/public/services");

  const pubDetail = await req(`/api/public/services/${serviceId}`);
  assert(pubDetail.status === 200, "cliente vê detalhe do serviço");

  jar.clear();
  await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT", name: "Cliente Svc", email: clientEmail, password: pwd, confirmPassword: pwd,
      phone: phone(ts + 1), birthDate: "1990-01-01",
    }),
  });
  const pet = await req("/api/client/pets", { method: "POST", body: JSON.stringify({ name: "Rex", species: "DOG" }) });
  assert(pet.status === 201, "cliente cadastra pet");
  const petId = pet.data.data.pet.id;

  const startAt = new Date();
  startAt.setDate(startAt.getDate() + 3);
  startAt.setHours(10, 0, 0, 0);
  const weekday = startAt.getDay();

  jar.clear();
  await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: partnerEmail, password: pwd }) });
  await req("/api/partner/availability", {
    method: "PUT",
    body: JSON.stringify({ slots: [{ weekday, startTime: "09:00", endTime: "18:00", intervalMinutes: 30 }] }),
  });

  jar.clear();
  await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: clientEmail, password: pwd }) });
  const booking = await req("/api/client/appointments", {
    method: "POST",
    body: JSON.stringify({ petId, serviceId, startAt: startAt.toISOString() }),
  });
  assert(booking.status === 201, "cliente inicia agendamento");

  jar.clear();
  await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: partnerEmail, password: pwd }) });
  const edited = await req(`/api/partner/services/${serviceId}`, {
    method: "PUT",
    body: JSON.stringify({ name: "Banho Editado" }),
  });
  assert(edited.status === 200, "parceiro edita serviço");

  const deactivated = await req(`/api/partner/services/${serviceId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "INACTIVE" }),
  });
  assert(deactivated.status === 200, "parceiro desativa serviço");
  const pubInactive = await req(`/api/public/services/${serviceId}`);
  assert(pubInactive.status === 404, "serviço inativo não aparece publicamente");

  jar.clear();
  await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: clientEmail, password: pwd }) });
  const clientCreate = await req("/api/partner/services", {
    method: "POST",
    body: JSON.stringify({ name: "X", description: "Y", category: "BATH_GROOMING", price: 1, durationMin: 30 }),
  });
  assert(clientCreate.status === 403, "cliente não cria serviço");

  jar.clear();
  await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "ONG", name: "ONG", email: ongEmail, password: pwd, confirmPassword: pwd,
      phone: phone(ts + 2), ongName: "ONG Teste", responsibleName: "Resp",
      cnpj: cnpj(), address: "Rua B", city: "SP", state: "SP",
    }),
  });
  const ongCreate = await req("/api/partner/services", {
    method: "POST",
    body: JSON.stringify({ name: "X", description: "Y", category: "BATH_GROOMING", price: 1, durationMin: 30 }),
  });
  assert(ongCreate.status === 403, "ONG não cria serviço");

  const otherPartner = `other.svc.${ts}@test.ecopet.local`;
  await registerPartner(otherPartner, ts + 9);
  const foreignEdit = await req(`/api/partner/services/${serviceId}`, {
    method: "PUT",
    body: JSON.stringify({ name: "Hack" }),
  });
  assert(foreignEdit.status === 404, "parceiro não edita serviço de outro");

  console.log("✓ test:foundation:services passou");
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
