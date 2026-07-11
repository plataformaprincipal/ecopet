import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminUsageStats } from "@/lib/ai/ai-usage";
import { getAiStatus, AI_CONFIG } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireAdmin();
  if (error || !user) return error!;

  const from = new Date();
  from.setDate(1);
  from.setHours(0, 0, 0, 0);
  const to = new Date();

  const [usage, docs, jobs, moderation, status] = await Promise.all([
    getAdminUsageStats(from, to),
    prisma.aIKnowledgeDocument.count({ where: { status: "ACTIVE" } }),
    prisma.aIJob.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.aIModerationQueue.count({ where: { status: "PENDING" } }),
    Promise.resolve(getAiStatus()),
  ]);

  return apiSuccess({
    status,
    config: {
      model: AI_CONFIG.model,
      embeddingModel: AI_CONFIG.embeddingModel,
      dailyUserLimit: AI_CONFIG.dailyUserLimit,
      monthlyBudgetCents: AI_CONFIG.monthlyBudgetCents,
      globallyEnabled: AI_CONFIG.globallyEnabled,
      // nunca retornar a chave
    },
    usage,
    indexedDocuments: docs,
    pendingModeration: moderation,
    recentJobs: jobs,
  });
}
