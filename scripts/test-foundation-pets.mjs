/**
 * Testes Etapa 5 — Meu Pet
 */
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";

function assert(c, m) { if (!c) throw new Error(m); }

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
  return req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: pwd }) });
}

async function ensureUser(email, role, password) {
  const hash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    create: { email, name: role, passwordHash: hash, role, accountStatus: AccountStatus.ACTIVE, phone: `11${Date.now().toString().slice(-9)}` },
    update: { passwordHash: hash, role, accountStatus: AccountStatus.ACTIVE },
  });
}

async function main() {
  const ts = Date.now();
  const clientEmail = `client.pets.${ts}@test.ecopet.local`;
  const partnerEmail = `partner.pets.${ts}@test.ecopet.local`;
  const ongEmail = `ong.pets.${ts}@test.ecopet.local`;
  const otherEmail = `other.pets.${ts}@test.ecopet.local`;

  await ensureUser(clientEmail, UserRole.CLIENT, pwd);
  await ensureUser(partnerEmail, UserRole.PARTNER, pwd);
  await ensureUser(ongEmail, UserRole.ONG, pwd);
  await ensureUser(otherEmail, UserRole.CLIENT, pwd);

  await login(clientEmail);

  const create = await req("/api/client/pets", {
    method: "POST",
    body: JSON.stringify({ name: "Rex", species: "DOG", weight: 12 }),
  });
  assert(create.status === 201 && create.data.success, "create pet");
  const petId = create.data.data.pet.id;

  const list = await req("/api/client/pets");
  assert(list.data.data.pets.length >= 1, "list pets");

  const edit = await req(`/api/client/pets/${petId}`, {
    method: "PUT",
    body: JSON.stringify({ name: "Rex Atualizado", species: "DOG" }),
  });
  assert(edit.status === 200, "edit pet");

  await login(otherEmail);
  const forbidden = await req(`/api/client/pets/${petId}`);
  assert(forbidden.status === 404, "other user cannot access pet");

  await login(partnerEmail);
  const partnerCreate = await req("/api/client/pets", {
    method: "POST",
    body: JSON.stringify({ name: "X", species: "DOG" }),
  });
  assert(partnerCreate.status === 403, "partner cannot create pet");

  await login(ongEmail);
  const ongCreate = await req("/api/client/pets", {
    method: "POST",
    body: JSON.stringify({ name: "Y", species: "DOG" }),
  });
  assert(ongCreate.status === 403, "ong cannot create pet");

  await login(clientEmail);
  const badDate = await req("/api/client/pets", {
    method: "POST",
    body: JSON.stringify({ name: "Futuro", species: "DOG", birthDate: "2099-01-01" }),
  });
  assert(badDate.status === 400, "future date rejected");

  const badWeight = await req("/api/client/pets", {
    method: "POST",
    body: JSON.stringify({ name: "Peso", species: "DOG", weight: -1 }),
  });
  assert(badWeight.status === 400, "negative weight rejected");

  const health = await req(`/api/client/pets/${petId}/health`, {
    method: "POST",
    body: JSON.stringify({ resource: "vaccination", data: { name: "V8", appliedAt: "2024-01-15" } }),
  });
  assert(health.status === 201, "vaccine created");

  const allergy = await req(`/api/client/pets/${petId}/health`, {
    method: "POST",
    body: JSON.stringify({ resource: "allergy", data: { name: "Frango", severity: "MEDIA" } }),
  });
  assert(allergy.status === 201, "allergy created");

  const record = await req(`/api/client/pets/${petId}/health`, {
    method: "POST",
    body: JSON.stringify({ resource: "health", data: { type: "CONSULTA", title: "Checkup", eventDate: "2024-06-01" } }),
  });
  assert(record.status === 201, "health record");

  const reminder = await req(`/api/client/pets/${petId}/health`, {
    method: "POST",
    body: JSON.stringify({
      resource: "reminder",
      data: { type: "VACINA", title: "Reforço", dueAt: new Date(Date.now() + 86400000).toISOString() },
    }),
  });
  assert(reminder.status === 201, "reminder");

  const del = await req(`/api/client/pets/${petId}`, { method: "DELETE" });
  assert(del.status === 200, "soft delete");

  const listAfter = await req("/api/client/pets");
  assert(!listAfter.data.data.pets.find((p) => p.id === petId), "deleted not listed");

  console.log("✓ test:foundation:pets passou");
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
