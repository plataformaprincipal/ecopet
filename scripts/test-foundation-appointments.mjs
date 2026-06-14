/**
 * Testes Etapa 6 — Agenda e serviços
 */
import { PrismaClient, AccountStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";

function assert(c, m) { if (!c) throw new Error(m); }
function cnpj() { return String(Date.now()).slice(-10).padEnd(14, "0").slice(0, 14); }

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (jar.get("cookie")) headers.Cookie = jar.get("cookie");
  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  if (sc?.includes("ecopet-session")) jar.set("cookie", sc.split(";")[0]);
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function login(email) {
  jar.clear();
  const r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: pwd }) });
  assert(r.status === 200, `login ${email}`);
  return r;
}

function phone(suffix) {
  return `119${String(suffix).padStart(8, "0").slice(-8)}`;
}

async function registerPartner(email, status = AccountStatus.PENDING, phoneSuffix) {
  jar.clear();
  const c = cnpj();
  const reg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER", name: "Parceiro", email, password: pwd, confirmPassword: pwd,
      phone: phone(phoneSuffix), businessName: "Loja", legalName: "Loja LTDA",
      cnpj: c, category: "Pet Shop", address: "Rua A", city: "SP", state: "SP",
    }),
  });
  assert(reg.status === 201, `register partner ${email} (${reg.status} ${reg.data?.error?.message ?? ""})`);
  if (status === AccountStatus.ACTIVE) {
    await prisma.user.update({ where: { email }, data: { accountStatus: AccountStatus.ACTIVE } });
  }
  return reg;
}

async function main() {
  const ts = Date.now();
  const pendingEmail = `partner.pend.${ts}@test.ecopet.local`;
  const activeEmail = `partner.act.${ts}@test.ecopet.local`;
  const clientEmail = `client.appt.${ts}@test.ecopet.local`;

  await registerPartner(pendingEmail, AccountStatus.PENDING, ts + 1);
  const pendingSvc = await req("/api/partner/services", {
    method: "POST",
    body: JSON.stringify({
      name: "Banho", description: "Banho completo", category: "BATH_GROOMING", price: 50, durationMin: 60,
    }),
  });
  assert(pendingSvc.status === 403, "pending partner blocked");

  await registerPartner(activeEmail, AccountStatus.ACTIVE, ts + 2);
  await login(activeEmail);

  const svc = await req("/api/partner/services", {
    method: "POST",
    body: JSON.stringify({
      name: "Banho Premium", description: "Banho e tosa", category: "BATH_GROOMING", price: 80, durationMin: 90, status: "ACTIVE",
    }),
  });
  assert(svc.status === 201, "active partner creates service");
  const serviceId = svc.data.data.service.id;

  const draft = await req("/api/partner/services", {
    method: "POST",
    body: JSON.stringify({
      name: "Rascunho", description: "Draft", category: "BATH_GROOMING", price: 10, status: "DRAFT",
    }),
  });
  assert(draft.status === 201, "draft service");

  const listPartner = await req("/api/partner/services");
  assert(listPartner.data.data.services.length >= 2, "partner lists own services");

  jar.clear();
  const clientReg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT", name: "Cliente", email: clientEmail, password: pwd, confirmPassword: pwd,
      phone: phone(ts + 3), birthDate: "1990-01-01",
    }),
  });
  assert(clientReg.status === 201, `client register (${clientReg.status} ${clientReg.data?.error?.message ?? ""})`);

  const clientList = await req("/api/client/services");
  assert(clientList.data.data.services.some((s) => s.id === serviceId), "client sees active service");
  assert(!clientList.data.data.services.some((s) => s.status === "DRAFT"), "client no draft");

  const noPetAppt = await req("/api/client/appointments", {
    method: "POST",
    body: JSON.stringify({
      petId: "invalid", serviceId, startAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    }),
  });
  assert(noPetAppt.status === 403, "invalid pet blocked");

  const pet = await req("/api/client/pets", {
    method: "POST",
    body: JSON.stringify({ name: "Luna", species: "DOG" }),
  });
  assert(pet.status === 201, "client creates pet");
  const petId = pet.data.data.pet.id;

  const startAt = new Date();
  startAt.setDate(startAt.getDate() + 3);
  startAt.setHours(10, 0, 0, 0);
  const weekday = startAt.getDay();

  const noAvail = await req("/api/client/appointments", {
    method: "POST",
    body: JSON.stringify({ petId, serviceId, startAt: startAt.toISOString() }),
  });
  assert(noAvail.status === 400, "no availability");

  await login(activeEmail);
  await req("/api/partner/availability", {
    method: "PUT",
    body: JSON.stringify({
      slots: [{ weekday, startTime: "09:00", endTime: "18:00", intervalMinutes: 30 }],
    }),
  });

  await login(clientEmail);
  const past = await req("/api/client/appointments", {
    method: "POST",
    body: JSON.stringify({ petId, serviceId, startAt: new Date(Date.now() - 3600000).toISOString() }),
  });
  assert(past.status === 400, "past blocked");

  const appt = await req("/api/client/appointments", {
    method: "POST",
    body: JSON.stringify({ petId, serviceId, startAt: startAt.toISOString(), notes: "Teste" }),
  });
  assert(appt.status === 201, "appointment created");
  const appointmentId = appt.data.data.appointment.id;

  const collision = await req("/api/client/appointments", {
    method: "POST",
    body: JSON.stringify({ petId, serviceId, startAt: startAt.toISOString() }),
  });
  assert(collision.status === 409, "collision blocked");

  await login(activeEmail);
  const partnerAppts = await req("/api/partner/appointments");
  assert(partnerAppts.data.data.appointments.length >= 1, "partner sees appointment");

  const confirm = await req(`/api/partner/appointments/${appointmentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  assert(confirm.status === 200, "partner confirms");

  await login(clientEmail);
  const cancel = await req(`/api/client/appointments/${appointmentId}/cancel`, { method: "PATCH" });
  assert(cancel.status === 200, "client cancels");

  await login(activeEmail);
  const partnerCancel = await req(`/api/partner/appointments/${appointmentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CANCELLED", reason: "Teste parceiro" }),
  });
  assert(partnerCancel.status === 200 || partnerCancel.status === 400, "partner cancel attempt");

  const notifCount = await prisma.notification.count({
    where: { type: { startsWith: "APPOINTMENT" } },
  });
  assert(notifCount >= 1, "notifications created");

  console.log("✓ test:foundation:appointments passou");
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
