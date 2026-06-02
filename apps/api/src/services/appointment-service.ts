import { prisma } from "@ecopet/database";
import type { AppointmentStatus } from "@prisma/client";
import { AppError } from "../lib/app-errors.js";
import { createAuditLog } from "./audit-service.js";

const BUSINESS_HOUR_START = 7;
const BUSINESS_HOUR_END = 19;

export function parseTimeToMinutes(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

export function combineDateAndTime(dateStr: string, time: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function validateAppointmentSchedule(dateStr: string, time: string) {
  if (!dateStr?.trim()) {
    throw new AppError("Informe a data do agendamento.", 400, "DATE_REQUIRED");
  }
  if (!time?.trim()) {
    throw new AppError("Informe o horário do agendamento.", 400, "TIME_REQUIRED");
  }

  const minutes = parseTimeToMinutes(time);
  if (minutes === null) {
    throw new AppError("Horário inválido. Use o formato HH:MM (ex.: 09:30).", 400, "TIME_INVALID");
  }

  const startMinutes = BUSINESS_HOUR_START * 60;
  const endMinutes = BUSINESS_HOUR_END * 60;
  if (minutes < startMinutes || minutes >= endMinutes) {
    throw new AppError(
      `Horário fora do expediente. Escolha entre ${String(BUSINESS_HOUR_START).padStart(2, "0")}:00 e ${String(BUSINESS_HOUR_END).padStart(2, "0")}:00.`,
      400,
      "TIME_OUT_OF_RANGE"
    );
  }

  if (minutes % 30 !== 0) {
    throw new AppError("Horários disponíveis a cada 30 minutos (ex.: 09:00, 09:30).", 400, "TIME_SLOT");
  }

  const scheduledAt = combineDateAndTime(dateStr, time);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chosenDay = new Date(scheduledAt);
  chosenDay.setHours(0, 0, 0, 0);

  if (chosenDay < today) {
    throw new AppError("Não é possível agendar para datas passadas. Escolha hoje ou uma data futura.", 400, "DATE_PAST");
  }

  if (scheduledAt <= new Date()) {
    throw new AppError("O horário escolhido já passou. Selecione um horário futuro.", 400, "DATETIME_PAST");
  }

  return { scheduledAt, scheduledDate: chosenDay };
}

function serializeAppointment(row: Awaited<ReturnType<typeof fetchAppointmentById>>) {
  if (!row) return null;
  return {
    id: row.id,
    serviceType: row.serviceType,
    attendanceMode: row.attendanceMode,
    scheduledDate: row.scheduledDate.toISOString().slice(0, 10),
    scheduledTime: row.scheduledTime,
    scheduledAt: row.scheduledAt.toISOString(),
    observations: row.observations,
    status: row.status,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    cancelReason: row.cancelReason,
    completedAt: row.completedAt?.toISOString() ?? null,
    rescheduledFromId: row.rescheduledFromId,
    createdAt: row.createdAt.toISOString(),
    pet: {
      id: row.pet.id,
      name: row.pet.name,
      species: row.pet.species,
      breed: row.pet.breed,
      sex: row.pet.sex,
      birthDate: row.pet.birthDate?.toISOString() ?? null,
    },
    tutor: {
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
      phone: row.user.phone,
      cpf: row.user.cpf,
    },
  };
}

async function fetchAppointmentById(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, sex: true, birthDate: true } },
      user: { select: { id: true, name: true, email: true, phone: true, cpf: true } },
    },
  });
}

export async function listAppointments(userId: string, status?: AppointmentStatus) {
  const rows = await prisma.appointment.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    orderBy: { scheduledAt: status === "SCHEDULED" ? "asc" : "desc" },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, sex: true, birthDate: true } },
      user: { select: { id: true, name: true, email: true, phone: true, cpf: true } },
    },
  });
  return rows.map((r) => serializeAppointment(r)!);
}

export async function getAppointment(userId: string, id: string) {
  const row = await fetchAppointmentById(id);
  if (!row || row.userId !== userId) {
    throw new AppError("Agendamento não encontrado.", 404, "NOT_FOUND");
  }
  return serializeAppointment(row);
}

export async function createAppointment(params: {
  userId: string;
  petId: string;
  serviceType: string;
  attendanceMode: string;
  scheduledDate: string;
  scheduledTime: string;
  observations?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true, email: true, phone: true, cpf: true },
  });
  if (!user) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
  if (!user.phone?.trim()) {
    throw new AppError("Cadastre seu telefone no perfil antes de agendar.", 400, "PHONE_REQUIRED");
  }

  const pet = await prisma.pet.findFirst({
    where: { id: params.petId, ownerId: params.userId },
  });
  if (!pet) {
    throw new AppError("Selecione um pet válido cadastrado em sua conta.", 400, "PET_INVALID");
  }

  const { scheduledAt, scheduledDate } = validateAppointmentSchedule(params.scheduledDate, params.scheduledTime);

  const conflict = await prisma.appointment.findFirst({
    where: {
      userId: params.userId,
      petId: params.petId,
      status: "SCHEDULED",
      scheduledAt,
    },
  });
  if (conflict) {
    throw new AppError("Já existe um agendamento para este pet neste horário.", 409, "SLOT_TAKEN");
  }

  const created = await prisma.appointment.create({
    data: {
      userId: params.userId,
      petId: params.petId,
      serviceType: params.serviceType as never,
      attendanceMode: params.attendanceMode as never,
      scheduledDate,
      scheduledTime: params.scheduledTime,
      scheduledAt,
      observations: params.observations?.trim() || null,
      status: "SCHEDULED",
    },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, sex: true, birthDate: true } },
      user: { select: { id: true, name: true, email: true, phone: true, cpf: true } },
    },
  });

  await createAuditLog({
    userId: params.userId,
    action: "CREATE",
    module: "appointments",
    resource: "appointment",
    resourceId: created.id,
    observation: `Agendamento ${created.serviceType} — ${pet.name}`,
  });

  return serializeAppointment(created)!;
}

export async function cancelAppointment(userId: string, id: string, reason?: string) {
  const existing = await prisma.appointment.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Agendamento não encontrado.", 404, "NOT_FOUND");
  if (existing.status !== "SCHEDULED") {
    throw new AppError("Somente agendamentos futuros podem ser cancelados.", 400, "INVALID_STATUS");
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: reason?.trim() || "Cancelado pelo tutor",
    },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, sex: true, birthDate: true } },
      user: { select: { id: true, name: true, email: true, phone: true, cpf: true } },
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    module: "appointments",
    resource: "appointment",
    resourceId: id,
    observation: "Agendamento cancelado",
  });

  return serializeAppointment(updated)!;
}

export async function rescheduleAppointment(
  userId: string,
  id: string,
  data: { scheduledDate: string; scheduledTime: string; observations?: string }
) {
  const existing = await prisma.appointment.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Agendamento não encontrado.", 404, "NOT_FOUND");
  if (existing.status !== "SCHEDULED") {
    throw new AppError("Somente agendamentos futuros podem ser reagendados.", 400, "INVALID_STATUS");
  }

  const { scheduledAt, scheduledDate } = validateAppointmentSchedule(data.scheduledDate, data.scheduledTime);

  await prisma.appointment.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: "Reagendado para nova data",
    },
  });

  const created = await prisma.appointment.create({
    data: {
      userId: existing.userId,
      petId: existing.petId,
      serviceType: existing.serviceType,
      attendanceMode: existing.attendanceMode,
      scheduledDate,
      scheduledTime: data.scheduledTime,
      scheduledAt,
      observations: data.observations?.trim() || existing.observations,
      status: "SCHEDULED",
      rescheduledFromId: existing.id,
    },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, sex: true, birthDate: true } },
      user: { select: { id: true, name: true, email: true, phone: true, cpf: true } },
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    module: "appointments",
    resource: "appointment",
    resourceId: created.id,
    observation: "Agendamento reagendado",
  });

  return serializeAppointment(created)!;
}

export async function completeAppointment(userId: string, id: string) {
  const existing = await prisma.appointment.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Agendamento não encontrado.", 404, "NOT_FOUND");
  if (existing.status !== "SCHEDULED") {
    throw new AppError("Este agendamento não está ativo.", 400, "INVALID_STATUS");
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, sex: true, birthDate: true } },
      user: { select: { id: true, name: true, email: true, phone: true, cpf: true } },
    },
  });

  return serializeAppointment(updated)!;
}

export const APPOINTMENT_META = {
  serviceTypes: [
    "BANHO",
    "TOSA",
    "BANHO_TOSA",
    "CONSULTA_VET",
    "VACINACAO",
    "HOSPEDAGEM",
    "PASSEIO",
    "TELEBUSCA",
    "ENTREGA_PET",
    "OUTROS",
  ],
  attendanceModes: ["IN_PERSON", "TELEBUSCA", "TUTOR_DELIVERY"],
  timeSlots: Array.from({ length: (BUSINESS_HOUR_END - BUSINESS_HOUR_START) * 2 }, (_, i) => {
    const total = BUSINESS_HOUR_START * 60 + i * 30;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }),
};
