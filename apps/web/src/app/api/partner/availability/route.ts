import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { availabilitySlotSchema, blockedSlotSchema } from "@/schemas/partner-service";

export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const [slots, blocked] = await Promise.all([
    prisma.partnerAvailability.findMany({ where: { partnerId: user!.id }, orderBy: { weekday: "asc" } }),
    prisma.partnerBlockedSlot.findMany({
      where: { partnerId: user!.id, endAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return apiSuccess({ slots, blocked });
}

export async function PUT(request: Request) {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const body = await request.json();
  const slotsParsed = z.array(availabilitySlotSchema).safeParse(body.slots ?? []);
  const blockedParsed = z.array(blockedSlotSchema).safeParse(body.blocked ?? []);

  if (!slotsParsed.success) {
    return apiFailure("VALIDATION", slotsParsed.error.errors[0]?.message ?? "Slots inválidos", 400);
  }

  for (const slot of slotsParsed.data) {
    if (slot.startTime >= slot.endTime) {
      return apiFailure("VALIDATION", "Horário inicial deve ser menor que o final.", 400);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.partnerAvailability.deleteMany({ where: { partnerId: user!.id } });
    if (slotsParsed.data.length) {
      await tx.partnerAvailability.createMany({
        data: slotsParsed.data.map((s) => ({
          partnerId: user!.id,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          intervalMinutes: s.intervalMinutes ?? 30,
          isActive: s.isActive ?? true,
        })),
      });
    }
    if (blockedParsed.success && blockedParsed.data.length) {
      await tx.partnerBlockedSlot.deleteMany({
        where: { partnerId: user!.id, startAt: { gte: new Date() } },
      });
      await tx.partnerBlockedSlot.createMany({
        data: blockedParsed.data.map((b) => ({
          partnerId: user!.id,
          startAt: new Date(b.startAt),
          endAt: new Date(b.endAt),
          reason: b.reason ?? null,
        })),
      });
    }
  });

  const [slots, blocked] = await Promise.all([
    prisma.partnerAvailability.findMany({ where: { partnerId: user!.id }, orderBy: { weekday: "asc" } }),
    prisma.partnerBlockedSlot.findMany({
      where: { partnerId: user!.id, endAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return apiSuccess({ slots, blocked, message: "Disponibilidade atualizada." });
}
