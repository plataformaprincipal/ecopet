import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";

const patchSchema = z.object({
  historyEnabled: z.boolean().optional(),
  personalizedRecommendations: z.boolean().optional(),
  retentionDays: z.number().int().min(7).max(3650).optional(),
  consentAiProcessing: z.boolean().optional(),
});

export async function GET() {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const settings = await prisma.aIPrivacySettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  return apiSuccess({ settings });
}

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Dados inválidos", 400);
  }

  const settings = await prisma.aIPrivacySettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });

  await writeAiAuditLog({
    userId: user.id,
    role: user.role,
    module: "profile",
    action: "privacy-settings",
    decision: "EXECUTED",
  });

  return apiSuccess({ settings });
}

export async function DELETE() {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  await prisma.aIConversation.updateMany({
    where: { userId: user.id, deletedAt: null },
    data: { deletedAt: new Date(), status: "INACTIVE" },
  });

  await writeAiAuditLog({
    userId: user.id,
    role: user.role,
    module: "profile",
    action: "delete-ai-history",
    decision: "EXECUTED",
  });

  return apiSuccess({ deleted: true });
}
