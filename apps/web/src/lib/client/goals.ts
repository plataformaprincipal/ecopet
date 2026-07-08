import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

export type GoalType =
  | "weight_loss"
  | "weight_gain"
  | "walk_routine"
  | "monthly_savings"
  | "vaccination_complete"
  | "spending_reduction"
  | "training"
  | "nutrition";

export type ClientGoal = {
  id: string;
  type: GoalType;
  title: string;
  target: number | null;
  current: number;
  unit: string;
  petId: string | null;
  petName: string | null;
  status: "active" | "completed" | "paused";
  createdAt: string;
  source: "user" | "suggested";
};

export type ClientGoalsPanel = {
  goals: ClientGoal[];
  suggestions: ClientGoal[];
};

const GOAL_LABELS: Record<GoalType, string> = {
  weight_loss: "Perda de peso",
  weight_gain: "Ganho de peso",
  walk_routine: "Rotina de passeio",
  monthly_savings: "Economia mensal",
  vaccination_complete: "Vacinação completa",
  spending_reduction: "Redução de gastos",
  training: "Treino",
  nutrition: "Alimentação",
};

const SESSION_TYPE = "client:goals";

type GoalsPayload = { goals: ClientGoal[] };

export async function loadClientGoals(userId: string): Promise<ClientGoal[]> {
  const session = await prisma.aiSession.findFirst({
    where: { userId, type: SESSION_TYPE },
    orderBy: { updatedAt: "desc" },
  });
  const payload = (session?.messages ?? {}) as GoalsPayload;
  return Array.isArray(payload.goals) ? payload.goals : [];
}

export async function saveClientGoals(userId: string, goals: ClientGoal[]): Promise<void> {
  const existing = await prisma.aiSession.findFirst({
    where: { userId, type: SESSION_TYPE },
    orderBy: { updatedAt: "desc" },
  });
  const payload: GoalsPayload = { goals };
  if (existing) {
    await prisma.aiSession.update({ where: { id: existing.id }, data: { messages: payload } });
  } else {
    await prisma.aiSession.create({ data: { userId, type: SESSION_TYPE, messages: payload } });
  }
}

export async function buildClientGoalsPanel(prismaClient: PrismaClient, userId: string): Promise<ClientGoalsPanel> {
  const goals = await loadClientGoals(userId);
  const suggestions = await buildSuggestedGoals(prismaClient, userId);
  return { goals, suggestions };
}

async function buildSuggestedGoals(prismaClient: PrismaClient, userId: string): Promise<ClientGoal[]> {
  const now = new Date();
  const pets = await prismaClient.pet.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true, name: true },
  });
  const petIds = pets.map((p) => p.id);
  if (petIds.length === 0) return [];

  const [weights, vaccinesDue, reminders, monthOrders] = await Promise.all([
    prismaClient.petWeightRecord.findMany({
      where: { petId: { in: petIds } },
      orderBy: { recordedAt: "desc" },
      take: 10,
    }),
    prismaClient.vaccination.count({ where: { petId: { in: petIds }, nextDue: { lte: now } } }),
    prismaClient.petReminder.count({ where: { petId: { in: petIds }, status: "PENDING" } }),
    prismaClient.order.aggregate({
      _sum: { total: true },
      where: { userId, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
    }),
  ]);

  const out: ClientGoal[] = [];
  const spent = monthOrders._sum.total ?? 0;

  if (vaccinesDue > 0) {
    out.push({
      id: "suggest-vaccines",
      type: "vaccination_complete",
      title: GOAL_LABELS.vaccination_complete,
      target: vaccinesDue,
      current: 0,
      unit: "vacinas",
      petId: null,
      petName: null,
      status: "active",
      createdAt: now.toISOString(),
      source: "suggested",
    });
  }

  if (reminders > 0) {
    out.push({
      id: "suggest-walk",
      type: "walk_routine",
      title: GOAL_LABELS.walk_routine,
      target: reminders,
      current: 0,
      unit: "lembretes",
      petId: null,
      petName: null,
      status: "active",
      createdAt: now.toISOString(),
      source: "suggested",
    });
  }

  if (spent > 300) {
    out.push({
      id: "suggest-spending",
      type: "spending_reduction",
      title: GOAL_LABELS.spending_reduction,
      target: Math.round(spent * 0.85),
      current: spent,
      unit: "R$",
      petId: null,
      petName: null,
      status: "active",
      createdAt: now.toISOString(),
      source: "suggested",
    });
  }

  const petMap = new Map(pets.map((p) => [p.id, p.name]));

  if (weights.length >= 2) {
    const w = weights[0]!;
    const prev = weights[1]!;
    const type: GoalType = w.weight > prev.weight ? "weight_loss" : "weight_gain";
    out.push({
      id: `suggest-weight-${w.petId}`,
      type,
      title: GOAL_LABELS[type],
      target: prev.weight,
      current: w.weight,
      unit: "kg",
      petId: w.petId,
      petName: petMap.get(w.petId) ?? null,
      status: "active",
      createdAt: now.toISOString(),
      source: "suggested",
    });
  }

  return out.slice(0, 6);
}

export { GOAL_LABELS };
