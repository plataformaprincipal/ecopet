import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const pets = await prisma.pet.findMany({
    where: { ownerId: user!.id, deletedAt: null },
    select: { id: true },
  });
  const petIds = pets.map((p) => p.id);

  if (petIds.length === 0) {
    return apiSuccess({ routine: { reminders: [], appointments: [], petsCount: 0 } });
  }

  const now = new Date();
  const [reminders, appointments] = await Promise.all([
    prisma.petReminder.findMany({
      where: { petId: { in: petIds }, status: "PENDING" },
      include: { pet: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 100,
    }),
    prisma.appointment.findMany({
      where: { userId: user!.id, scheduledAt: { gte: now } },
      include: {
        pet: { select: { name: true } },
        service: { select: { name: true, category: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 50,
    }),
  ]);

  return apiSuccess({
    routine: {
      petsCount: petIds.length,
      reminders: reminders.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        description: r.description ?? null,
        dueAt: r.dueAt.toISOString(),
        petName: r.pet.name,
      })),
      appointments: appointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt.toISOString(),
        status: a.status,
        petName: a.pet?.name ?? null,
        serviceName: a.service?.name ?? null,
        category: a.service?.category ? String(a.service.category) : null,
      })),
    },
  });
}
