import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";

const budgetSchema = z.object({ monthly: z.number().min(0).max(1_000_000) });

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const session = await prisma.aiSession.findFirst({
    where: { userId: user!.id, type: "client:budget" },
    orderBy: { updatedAt: "desc" },
  });
  const payload = (session?.messages ?? {}) as { monthly?: number };
  return apiSuccess({ monthly: payload.monthly ?? null });
}

export async function PUT(request: Request) {
  const { user, error } = await requireClient();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const existing = await prisma.aiSession.findFirst({
    where: { userId: user.id, type: "client:budget" },
    orderBy: { updatedAt: "desc" },
  });
  const payload = { monthly: parsed.data.monthly };
  if (existing) {
    await prisma.aiSession.update({ where: { id: existing.id }, data: { messages: payload } });
  } else {
    await prisma.aiSession.create({ data: { userId: user.id, type: "client:budget", messages: payload } });
  }

  return apiSuccess({ monthly: parsed.data.monthly });
}
