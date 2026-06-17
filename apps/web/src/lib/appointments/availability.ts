import { AccountStatus, PartnerServiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasAppointmentConflict, isWithinAvailability, parseTimeToMinutes } from "@/lib/appointments/booking";
import {
  localDateTime,
  parseDateIso,
  startOfLocalDay,
  startOfTomorrowLocal,
} from "@/lib/appointments/datetime";

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5, 6];

/** Garante disponibilidade padrão seg–sáb 08:00–18:00 para o parceiro institucional. */
export async function ensureDefaultPartnerAvailability(partnerId: string) {
  const existing = await prisma.partnerAvailability.count({ where: { partnerId, isActive: true } });
  if (existing >= 6) return;

  for (const weekday of DEFAULT_WEEKDAYS) {
    const found = await prisma.partnerAvailability.findFirst({ where: { partnerId, weekday } });
    if (found) {
      await prisma.partnerAvailability.update({
        where: { id: found.id },
        data: { startTime: "08:00", endTime: "18:00", intervalMinutes: 60, isActive: true },
      });
    } else {
      await prisma.partnerAvailability.create({
        data: {
          partnerId,
          weekday,
          startTime: "08:00",
          endTime: "18:00",
          intervalMinutes: 60,
          isActive: true,
        },
      });
    }
  }
}

export async function getServiceAvailabilitySlots(serviceId: string, dateIso: string) {
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      deletedAt: null,
      status: PartnerServiceStatus.ACTIVE,
      isActive: true,
      provider: { accountStatus: AccountStatus.ACTIVE, role: "PARTNER" },
    },
  });
  if (!service) return null;

  const parsed = parseDateIso(dateIso);
  if (!parsed) return null;

  const { year, month, day } = parsed;
  const selectedDay = localDateTime(year, month, day, 0, 0);
  const tomorrow = startOfTomorrowLocal();
  const today = startOfLocalDay();

  if (selectedDay < tomorrow) {
    return { serviceId, date: dateIso, durationMin: service.durationMin ?? 60, slots: [] as string[] };
  }

  const weekday = selectedDay.getDay();
  if (weekday === 0) {
    return { serviceId, date: dateIso, durationMin: service.durationMin ?? 60, slots: [] as string[] };
  }

  const duration = service.durationMin ?? 60;

  let slots = await prisma.partnerAvailability.findMany({
    where: { partnerId: service.providerId, weekday, isActive: true },
  });

  if (!slots.length) {
    await ensureDefaultPartnerAvailability(service.providerId);
    slots = await prisma.partnerAvailability.findMany({
      where: { partnerId: service.providerId, weekday, isActive: true },
    });
  }

  if (!slots.length) {
    return { serviceId, date: dateIso, durationMin: duration, slots: [] as string[] };
  }

  const dayStart = localDateTime(year, month, day, 0, 0);
  const dayEnd = localDateTime(year, month, day, 23, 59);

  const blocked = await prisma.partnerBlockedSlot.findMany({
    where: {
      partnerId: service.providerId,
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
  });

  const now = new Date();
  const isToday =
    selectedDay.getFullYear() === today.getFullYear() &&
    selectedDay.getMonth() === today.getMonth() &&
    selectedDay.getDate() === today.getDate();

  const available: string[] = [];

  for (const slot of slots) {
    const startMin = parseTimeToMinutes(slot.startTime);
    const endMin = parseTimeToMinutes(slot.endTime);
    const step = Math.max(duration, slot.intervalMinutes ?? duration);

    for (let m = startMin; m + duration <= endMin; m += step) {
      const hours = Math.floor(m / 60);
      const minutes = m % 60;
      const startAt = localDateTime(year, month, day, hours, minutes);
      const endAt = new Date(startAt.getTime() + duration * 60_000);

      if (isToday && startAt <= now) continue;
      if (!isWithinAvailability(weekday, startAt, endAt, slots)) continue;

      const isBlocked = blocked.some((b) => b.startAt < endAt && b.endAt > startAt);
      if (isBlocked) continue;

      if (await hasAppointmentConflict(service.providerId, startAt, endAt, undefined, service.id)) {
        continue;
      }

      available.push(startAt.toISOString());
    }
  }

  return { serviceId, date: dateIso, durationMin: duration, slots: available };
}
