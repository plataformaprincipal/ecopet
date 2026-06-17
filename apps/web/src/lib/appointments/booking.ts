import { AppointmentServiceType, AppointmentAttendanceMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CATEGORY_TO_SERVICE_TYPE: Record<string, AppointmentServiceType> = {
  BATH_GROOMING: "BANHO_TOSA",
  VET_CONSULTATION: "CONSULTA_VET",
  VACCINATION: "VACINACAO",
  DOG_WALKER: "PASSEIO",
  PET_SITTER: "HOSPEDAGEM",
  TRAINING: "OUTROS",
  BOARDING: "HOSPEDAGEM",
  PET_TRANSPORT: "ENTREGA_PET",
};

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isWithinAvailability(
  weekday: number,
  startAt: Date,
  endAt: Date,
  slots: { weekday: number; startTime: string; endTime: string; isActive: boolean }[]
): boolean {
  const daySlots = slots.filter((s) => s.weekday === weekday && s.isActive);
  if (!daySlots.length) return false;

  const startMin = startAt.getHours() * 60 + startAt.getMinutes();
  const endMin = endAt.getHours() * 60 + endAt.getMinutes();

  return daySlots.some((slot) => {
    const slotStart = parseTimeToMinutes(slot.startTime);
    const slotEnd = parseTimeToMinutes(slot.endTime);
    return startMin >= slotStart && endMin <= slotEnd;
  });
}

export async function hasAppointmentConflict(
  partnerId: string,
  startAt: Date,
  endAt: Date,
  excludeId?: string,
  serviceId?: string
) {
  const appointments = await prisma.appointment.findMany({
    where: {
      partnerId,
      ...(serviceId ? { serviceId } : {}),
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ["PENDING", "CONFIRMED", "SCHEDULED"] },
    },
    select: {
      scheduledAt: true,
      endAt: true,
      service: { select: { durationMin: true } },
    },
  });

  return appointments.some((a) => {
    const durationMs = (a.service?.durationMin ?? 60) * 60_000;
    const aEnd = a.endAt ?? new Date(a.scheduledAt.getTime() + durationMs);
    return a.scheduledAt < endAt && aEnd > startAt;
  });
}

export function resolveServiceType(serviceName: string, category: string): AppointmentServiceType {
  const lower = serviceName.toLowerCase();
  if (lower.includes("banho") && lower.includes("tosa")) return "BANHO_TOSA";
  if (lower.includes("banho")) return "BANHO";
  if (lower.includes("tosa")) return "TOSA";
  return defaultServiceType(category);
}

export function defaultServiceType(category: string): AppointmentServiceType {
  return CATEGORY_TO_SERVICE_TYPE[category] ?? "OUTROS";
}

export function defaultAttendanceMode(): AppointmentAttendanceMode {
  return "IN_PERSON";
}
