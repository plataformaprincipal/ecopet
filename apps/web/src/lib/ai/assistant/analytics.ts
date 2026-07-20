import { prisma } from "@/lib/prisma";

/** Métricas agregadas do assistente (sem prompts). */
export async function getAssistantAnalyticsSummary() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [conversations, messages, usageRows, feedbacks, failures] = await Promise.all([
    prisma.aIConversation.count({ where: { deletedAt: null, module: "ecopet-ai" } }),
    prisma.aIMessage.count({
      where: { conversation: { module: "ecopet-ai", deletedAt: null } },
    }),
    prisma.aIUsage
      .findMany({
        where: { module: "ecopet-ai", createdAt: { gte: start } },
        select: { estimatedCost: true, inputTokens: true, outputTokens: true },
        take: 50_000,
      })
      .catch(
        () =>
          [] as {
            estimatedCost: number | null;
            inputTokens: number;
            outputTokens: number;
          }[],
      ),
    prisma.aIFeedback.count({ where: { createdAt: { gte: start } } }).catch(() => 0),
    prisma.aIUsage
      .count({
        where: { module: "ecopet-ai", success: false, createdAt: { gte: start } },
      })
      .catch(() => 0),
  ]);

  const monthTokens = usageRows.reduce(
    (s, r) => s + (r.inputTokens ?? 0) + (r.outputTokens ?? 0),
    0,
  );
  const monthCostUsd = usageRows.reduce((s, r) => s + (r.estimatedCost ?? 0), 0);

  return {
    conversations,
    messages,
    monthRequests: usageRows.length,
    monthTokens,
    monthCostUsd,
    feedbacksMonth: feedbacks,
    failuresMonth: failures,
    generatedAt: new Date().toISOString(),
  };
}
