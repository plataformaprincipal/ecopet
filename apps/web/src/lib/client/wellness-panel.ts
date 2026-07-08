import type { PrismaClient } from "@prisma/client";

export type WellnessFactor = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  detail: string;
};

export type ClientWellnessPanel = {
  index: number;
  level: "excelente" | "bom" | "atenção" | "crítico";
  factors: WellnessFactor[];
  alerts: Array<{ id: string; message: string; severity: string }>;
};

function levelFromIndex(index: number): ClientWellnessPanel["level"] {
  if (index >= 80) return "excelente";
  if (index >= 60) return "bom";
  if (index >= 40) return "atenção";
  return "crítico";
}

export async function buildClientWellnessPanel(prisma: PrismaClient, userId: string): Promise<ClientWellnessPanel> {
  const now = new Date();
  const pets = await prisma.pet.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true, name: true },
  });
  const petIds = pets.map((p) => p.id);

  if (petIds.length === 0) {
    return { index: 0, level: "atenção", factors: [], alerts: [] };
  }

  const [vaccines, medications, weights, reminders, devices, alerts, events] = await Promise.all([
    prisma.vaccination.findMany({ where: { petId: { in: petIds } } }),
    prisma.medication.findMany({
      where: { petId: { in: petIds }, OR: [{ endDate: null }, { endDate: { gte: now } }] },
    }),
    prisma.petWeightRecord.findMany({
      where: { petId: { in: petIds } },
      orderBy: { recordedAt: "desc" },
      take: 20,
    }),
    prisma.petReminder.findMany({ where: { petId: { in: petIds } } }),
    prisma.iotDevice.findMany({ where: { userId, petId: { in: petIds } } }),
    prisma.iotAlert.findMany({
      where: {
        device: { OR: [{ userId }, { ownerId: userId }] },
        resolved: false,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.petEvent.findMany({
      where: { petId: { in: petIds }, createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
    }),
  ]);

  const overdueVaccines = vaccines.filter((v) => v.nextDue && v.nextDue < now).length;
  const vaccineScore = vaccines.length === 0 ? 50 : Math.max(0, 100 - overdueVaccines * 25);

  const healthScore = medications.length > 0 || vaccines.length > 0 ? 75 : 40;

  let weightScore = 50;
  if (weights.length >= 2) {
    const latest = weights[0]!.weight;
    const prev = weights[1]!.weight;
    const delta = Math.abs(latest - prev) / (prev || 1);
    weightScore = delta < 0.05 ? 90 : delta < 0.1 ? 70 : 45;
  } else if (weights.length === 1) {
    weightScore = 60;
  }

  const done = reminders.filter((r) => r.status === "DONE").length;
  const routineScore = reminders.length === 0 ? 50 : Math.round((done / reminders.length) * 100);

  const foodReminders = reminders.filter((r) => /ração|racao|aliment|feed/i.test(`${r.type} ${r.title}`));
  const foodScore = foodReminders.length === 0 ? 55 : Math.round((foodReminders.filter((r) => r.status !== "PENDING").length / foodReminders.length) * 100);

  const activityEvents = events.filter((e) => /passeio|play|ativid|exerc/i.test(`${e.eventType} ${e.title}`));
  let activityScore = activityEvents.length > 0 ? 80 : 45;
  const sleepReadings = await prisma.iotReading.findMany({
    where: {
      deviceId: { in: devices.map((d) => d.id) },
      metricKey: { in: ["sleep", "sono", "rest"] },
    },
    orderBy: { recordedAt: "desc" },
    take: 5,
  });
  const sleepScore = sleepReadings.length > 0 ? 75 : devices.length > 0 ? 50 : 40;
  if (sleepReadings.length > 0) activityScore = Math.round((activityScore + sleepScore) / 2);

  const alertPenalty = Math.min(alerts.length * 8, 30);

  const factors: WellnessFactor[] = [
    { key: "health", label: "Saúde", score: healthScore, maxScore: 100, detail: `${medications.length} medicações ativas` },
    { key: "vaccines", label: "Vacinas", score: vaccineScore, maxScore: 100, detail: overdueVaccines > 0 ? `${overdueVaccines} em atraso` : "Em dia" },
    { key: "weight", label: "Peso", score: weightScore, maxScore: 100, detail: weights.length > 0 ? `${weights[0]!.weight} kg (último)` : "Sem registros" },
    { key: "routine", label: "Rotina", score: routineScore, maxScore: 100, detail: `${done}/${reminders.length || 0} concluídos` },
    { key: "food", label: "Alimentação", score: foodScore, maxScore: 100, detail: foodReminders.length > 0 ? "Lembretes de alimentação" : "Sem lembretes" },
    { key: "activity", label: "Atividade", score: activityScore, maxScore: 100, detail: `${activityEvents.length} atividades na semana` },
    { key: "sleep", label: "Sono (IoT)", score: sleepScore, maxScore: 100, detail: sleepReadings.length > 0 ? "Dados de sono disponíveis" : "Sem sensor de sono" },
  ];

  const raw = factors.reduce((s, f) => s + f.score, 0) / factors.length;
  const index = Math.max(0, Math.round(raw - alertPenalty));

  return {
    index,
    level: levelFromIndex(index),
    factors,
    alerts: alerts.map((a) => ({ id: a.id, message: a.message, severity: a.severity })),
  };
}
