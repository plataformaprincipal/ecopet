import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import {
  buildClientGoalsPanel,
  saveClientGoals,
  loadClientGoals,
  GOAL_LABELS,
  type ClientGoal,
  type GoalType,
} from "@/lib/client/goals";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const panel = await buildClientGoalsPanel(prisma, user!.id);
  return apiSuccess({ goals: panel });
}

const createSchema = z.object({
  type: z.string(),
  title: z.string().min(1).max(120).optional(),
  target: z.number().nullable().optional(),
  current: z.number().optional(),
  unit: z.string().max(20).optional(),
  petId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const type = parsed.data.type as GoalType;
  if (!(type in GOAL_LABELS)) {
    return apiFailure("VALIDATION", "Tipo de meta inválido.", 400);
  }

  if (parsed.data.petId) {
    const pet = await prisma.pet.findFirst({
      where: { id: parsed.data.petId, ownerId: user.id, deletedAt: null },
    });
    if (!pet) return apiFailure("FORBIDDEN", "Pet não pertence a este usuário.", 403);
  }

  const goals = await loadClientGoals(user.id);
  const goal: ClientGoal = {
    id: `goal-${Date.now()}`,
    type,
    title: parsed.data.title ?? GOAL_LABELS[type],
    target: parsed.data.target ?? null,
    current: parsed.data.current ?? 0,
    unit: parsed.data.unit ?? "",
    petId: parsed.data.petId ?? null,
    petName: parsed.data.petId
      ? (await prisma.pet.findUnique({ where: { id: parsed.data.petId }, select: { name: true } }))?.name ?? null
      : null,
    status: "active",
    createdAt: new Date().toISOString(),
    source: "user",
  };

  await saveClientGoals(user.id, [...goals, goal]);
  return apiSuccess({ goal });
}
