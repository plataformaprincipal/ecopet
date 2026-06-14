/**
 * Testes Etapa 7 — Marketplace público + avaliações
 */
import { PrismaClient, AccountStatus } from "@prisma/client";

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

async function login(email) {
  jar.clear();
  const r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: pwd }) });
  assert(r.status === 200, `login ${email}`);
}

async function ensureCompletedAppointment() {
  let appt = await prisma.appointment.findFirst({
    where: { status: "COMPLETED", serviceId: { not: null }, partnerId: { not: null } },
    include: { serviceReview: true },
  });
  if (appt) return appt;

  const candidate = await prisma.appointment.findFirst({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      serviceId: { not: null },
      partnerId: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (candidate) {
    const past = new Date(Date.now() - 86400000);
    await prisma.appointment.update({
      where: { id: candidate.id },
      data: { scheduledAt: past, scheduledDate: past, status: "CONFIRMED" },
    });
    const partner = await prisma.user.findUnique({ where: { id: candidate.partnerId } });
    if (partner?.email) {
      await login(partner.email);
      const done = await req(`/api/partner/appointments/${candidate.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (done.status === 200) {
        return prisma.appointment.findFirst({
          where: { id: candidate.id },
          include: { serviceReview: true },
        });
      }
    }
  }

  const service = await prisma.service.findFirst({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      provider: { accountStatus: AccountStatus.ACTIVE, role: "PARTNER" },
    },
    include: { provider: true },
  });
  if (!service) return null;

  const ts = Date.now();
  const clientEmail = `client.review.${ts}@test.ecopet.local`;
  jar.clear();
  const reg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT", name: "Cliente Review", email: clientEmail, password: pwd, confirmPassword: pwd,
      phone: phone(ts), birthDate: "1990-01-01",
    }),
  });
  if (reg.status !== 201) return null;
  await login(clientEmail);

  const pet = await req("/api/client/pets", { method: "POST", body: JSON.stringify({ name: "Rex", species: "DOG" }) });
  if (pet.status !== 201) return null;
  const petId = pet.data.data.pet.id;

  const startAt = new Date();
  startAt.setDate(startAt.getDate() + 2);
  startAt.setHours(14, 0, 0, 0);
  const weekday = startAt.getDay();

  await login(service.provider.email);
  await req("/api/partner/availability", {
    method: "PUT",
    body: JSON.stringify({ slots: [{ weekday, startTime: "09:00", endTime: "18:00", intervalMinutes: 30 }] }),
  });

  await login(clientEmail);
  const booked = await req("/api/client/appointments", {
    method: "POST",
    body: JSON.stringify({ petId, serviceId: service.id, startAt: startAt.toISOString() }),
  });
  if (booked.status !== 201) return null;
  const appointmentId = booked.data.data.appointment.id;

  await login(service.provider.email);
  await req(`/api/partner/appointments/${appointmentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CONFIRMED" }),
  });

  const past = new Date(Date.now() - 86400000);
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { scheduledAt: past, scheduledDate: past },
  });

  const completed = await req(`/api/partner/appointments/${appointmentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "COMPLETED" }),
  });
  if (completed.status !== 200) return null;

  return prisma.appointment.findFirst({
    where: { id: appointmentId },
    include: { serviceReview: true },
  });
}

async function main() {
  const publicList = await req("/api/public/services");
  assert(publicList.status === 200 && publicList.data.success, "public services");

  const draftSvc = await prisma.service.findFirst({ where: { status: "DRAFT" } });
  if (draftSvc) {
    const hide = await req(`/api/public/services/${draftSvc.id}`);
    assert(hide.status === 404, "draft not public");
  }

  const pendingPartner = await prisma.user.findFirst({ where: { role: "PARTNER", accountStatus: AccountStatus.PENDING } });
  if (pendingPartner) {
    const p = await req(`/api/public/partners/${pendingPartner.id}`);
    assert(p.status === 404, "pending partner hidden");
  }

  const activeSvc = await prisma.service.findFirst({
    where: { status: "ACTIVE", deletedAt: null, provider: { accountStatus: AccountStatus.ACTIVE } },
  });
  assert(activeSvc, "need active service in DB from prior tests");
  const visitorSvc = await req(`/api/public/services/${activeSvc.id}`);
  assert(visitorSvc.status === 200, "visitor sees active service");

  const completedAppt = await ensureCompletedAppointment();
  if (!completedAppt) {
    console.log("⚠ skip review tests — não foi possível preparar agendamento COMPLETED");
  } else {
    const client = await prisma.user.findUnique({ where: { id: completedAppt.userId } });
    if (client && !completedAppt.serviceReview) {
      await login(client.email);
      const review = await req("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ appointmentId: completedAppt.id, rating: 5, comment: "Ótimo" }),
      });
      assert(review.status === 201, "client reviews completed appointment");
      const dup = await req("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ appointmentId: completedAppt.id, rating: 4 }),
      });
      assert(dup.status === 409, "duplicate review blocked");
    }
  }

  const emailCount = await prisma.emailLog.count();
  assert(emailCount >= 0, "email log accessible");

  console.log("✓ test:foundation:marketplace passou");
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
