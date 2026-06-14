import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { appointmentCreateSchema } from "@/schemas/partner-service";
import {
  defaultAttendanceMode,
  defaultServiceType,
  hasAppointmentConflict,
  isWithinAvailability,
} from "@/lib/appointments/booking";
import { createInternalNotification } from "@/lib/notifications/internal";
import { emailAppointmentEvent } from "@/lib/mail/event-dispatch";
import { AccountStatus, PartnerServiceStatus } from "@prisma/client";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const appointments = await prisma.appointment.findMany({
    where: { userId: user!.id },
    include: {
      pet: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, price: true } },
      partner: { select: { id: true, name: true, partnerProfile: { select: { businessName: true } } } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return apiSuccess({ appointments, total: appointments.length });
}

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error) return error;

  const parsed = appointmentCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const { petId, serviceId, startAt, notes } = parsed.data;
  const start = new Date(startAt);
  if (start <= new Date()) {
    return apiFailure("VALIDATION", "Não é possível agendar no passado.", 400);
  }

  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: user!.id, deletedAt: null },
  });
  if (!pet) return apiFailure("FORBIDDEN", "Pet inválido.", 403);

  const petCount = await prisma.pet.count({ where: { ownerId: user!.id, deletedAt: null } });
  if (petCount === 0) {
    return apiFailure("VALIDATION", "Cadastre um pet antes de agendar.", 400);
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      deletedAt: null,
      status: PartnerServiceStatus.ACTIVE,
      provider: { accountStatus: AccountStatus.ACTIVE, role: "PARTNER" },
    },
    include: { provider: true },
  });
  if (!service) return apiFailure("NOT_FOUND", "Serviço indisponível.", 404);

  const duration = service.durationMin ?? 60;
  const end = new Date(start.getTime() + duration * 60_000);

  const slots = await prisma.partnerAvailability.findMany({
    where: { partnerId: service.providerId, isActive: true },
  });
  if (!slots.length) {
    return apiFailure("VALIDATION", "Parceiro sem disponibilidade configurada.", 400);
  }

  if (!isWithinAvailability(start.getDay(), start, end, slots)) {
    return apiFailure("VALIDATION", "Horário fora da disponibilidade do parceiro.", 400);
  }

  const blocked = await prisma.partnerBlockedSlot.findFirst({
    where: {
      partnerId: service.providerId,
      startAt: { lt: end },
      endAt: { gt: start },
    },
  });
  if (blocked) {
    return apiFailure("VALIDATION", "Horário bloqueado pelo parceiro.", 400);
  }

  if (await hasAppointmentConflict(service.providerId, start, end)) {
    return apiFailure("VALIDATION", "Horário indisponível.", 409);
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId: user!.id,
      petId,
      partnerId: service.providerId,
      serviceId: service.id,
      serviceType: defaultServiceType(service.category),
      attendanceMode: defaultAttendanceMode(),
      scheduledDate: start,
      scheduledTime: start.toISOString().slice(11, 16),
      scheduledAt: start,
      endAt: end,
      observations: notes ?? null,
      status: "PENDING",
    },
  });

  await Promise.all([
    createInternalNotification({
      userId: user!.id,
      title: "Agendamento solicitado",
      body: `Seu agendamento para ${service.name} foi registrado.`,
      type: "APPOINTMENT_CREATED",
      data: { appointmentId: appointment.id },
    }),
    createInternalNotification({
      userId: service.providerId,
      title: "Novo agendamento",
      body: `Você recebeu um novo agendamento para ${service.name}.`,
      type: "APPOINTMENT_RECEIVED",
      data: { appointmentId: appointment.id },
    }),
  ]);

  const [clientUser, partnerUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: user!.id }, select: { email: true, name: true } }),
    prisma.user.findUnique({ where: { id: service.providerId }, select: { email: true, name: true } }),
  ]);
  if (clientUser?.email) {
    void emailAppointmentEvent(
      "APPOINTMENT_CREATED",
      clientUser.email,
      "Agendamento solicitado — EcoPet",
      `Olá ${clientUser.name}, seu agendamento para ${service.name} foi registrado.`
    );
  }
  if (partnerUser?.email) {
    void emailAppointmentEvent(
      "APPOINTMENT_CREATED",
      partnerUser.email,
      "Novo agendamento — EcoPet",
      `Você recebeu um novo agendamento para ${service.name}.`
    );
  }

  return apiSuccess({ appointment }, 201);
}
