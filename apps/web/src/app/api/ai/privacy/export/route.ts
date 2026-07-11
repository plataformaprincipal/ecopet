import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

/** Exportação LGPD do histórico de IA do usuário. */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const [conversations, usages, feedbacks, privacy] = await Promise.all([
    prisma.aIConversation.findMany({
      where: { userId: user.id },
      include: { messages: true },
    }),
    prisma.aIUsage.findMany({ where: { userId: user.id }, take: 1000 }),
    prisma.aIFeedback.findMany({ where: { userId: user.id } }),
    prisma.aIPrivacySettings.findUnique({ where: { userId: user.id } }),
  ]);

  return apiSuccess({
    exportedAt: new Date().toISOString(),
    privacy,
    conversations,
    usages,
    feedbacks,
  });
}
