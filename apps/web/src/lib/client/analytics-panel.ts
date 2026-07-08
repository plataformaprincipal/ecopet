import type { PrismaClient } from "@prisma/client";

export type ChartPoint = { label: string; value: number };

export type ClientAnalyticsPanel = {
  weightEvolution: ChartPoint[];
  monthlySpending: ChartPoint[];
  consultationsByPeriod: ChartPoint[];
  vaccinesPending: number;
  purchasesByCategory: ChartPoint[];
  topServices: ChartPoint[];
  routineCompletion: { completed: number; pending: number; rate: number };
  petActivities: Array<{ id: string; title: string; eventType: string; petName: string; createdAt: string }>;
};

function monthBuckets(months: number) {
  const out: { start: Date; end: Date; label: string }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = start.toLocaleDateString("pt-BR", { month: "short" });
    out.push({ start, end, label });
  }
  return out;
}

export async function buildClientAnalyticsPanel(prisma: PrismaClient, userId: string): Promise<ClientAnalyticsPanel> {
  const pets = await prisma.pet.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true, name: true },
  });
  const petIds = pets.map((p) => p.id);
  const buckets = monthBuckets(6);
  const rangeStart = buckets[0]?.start ?? new Date();

  const [weights, orders, consultations, vaccinesPending, reminders, appointments, events] = await Promise.all([
    petIds.length
      ? prisma.petWeightRecord.findMany({
          where: { petId: { in: petIds }, recordedAt: { gte: rangeStart } },
          orderBy: { recordedAt: "asc" },
          take: 60,
        })
      : Promise.resolve([]),
    prisma.order.findMany({
      where: { userId, createdAt: { gte: rangeStart } },
      include: { items: { include: { product: { select: { catalogCategory: true } } } } },
    }),
    petIds.length
      ? prisma.consultation.findMany({
          where: { petId: { in: petIds }, date: { gte: rangeStart } },
        })
      : Promise.resolve([]),
    petIds.length
      ? prisma.vaccination.count({
          where: { petId: { in: petIds }, nextDue: { lte: new Date() } },
        })
      : Promise.resolve(0),
    petIds.length
      ? prisma.petReminder.findMany({ where: { petId: { in: petIds } } })
      : Promise.resolve([]),
    prisma.appointment.findMany({
      where: { userId, scheduledAt: { gte: rangeStart } },
      include: { service: { select: { name: true, category: true } } },
    }),
    petIds.length
      ? prisma.petEvent.findMany({
          where: { petId: { in: petIds } },
          include: { pet: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 12,
        })
      : Promise.resolve([]),
  ]);

  const weightEvolution: ChartPoint[] = weights.map((w) => ({
    label: w.recordedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    value: w.weight,
  }));

  const monthlySpending = buckets.map((b) => ({
    label: b.label,
    value: orders.filter((o) => o.createdAt >= b.start && o.createdAt <= b.end).reduce((s, o) => s + o.total, 0),
  }));

  const consultationsByPeriod = buckets.map((b) => ({
    label: b.label,
    value: consultations.filter((c) => c.date >= b.start && c.date <= b.end).length,
  }));

  const catMap = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.items) {
      const cat = item.product?.catalogCategory ?? item.itemType ?? "Outros";
      catMap.set(cat, (catMap.get(cat) ?? 0) + item.price * item.quantity);
    }
  }
  const purchasesByCategory = [...catMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const serviceMap = new Map<string, number>();
  for (const a of appointments) {
    const name = a.service?.name ?? "Serviço";
    serviceMap.set(name, (serviceMap.get(name) ?? 0) + 1);
  }
  const topServices = [...serviceMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const completed = reminders.filter((r) => r.status === "DONE").length;
  const pending = reminders.filter((r) => r.status === "PENDING").length;
  const total = completed + pending;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    weightEvolution,
    monthlySpending,
    consultationsByPeriod,
    vaccinesPending,
    purchasesByCategory,
    topServices,
    routineCompletion: { completed, pending, rate },
    petActivities: events.map((e) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      petName: e.pet.name,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
