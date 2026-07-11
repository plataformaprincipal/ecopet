import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ingestKnowledgeDocument, createEmbeddings } from "@/lib/ai/ai-embeddings";
import { moderateContent } from "@/lib/ai/ai-moderation";

/**
 * Worker controlado para AIJob — processa um lote por chamada.
 * Pode ser invocado por cron/admin sem bloquear HTTP longo.
 */
export async function processAiJobs(limit = 5) {
  const jobs = await prisma.aIJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const results = [];
  for (const job of jobs) {
    await prisma.aIJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
    });
    try {
      let result: unknown = null;
      const payload = (job.payload ?? {}) as Record<string, unknown>;

      if (job.type === "EMBEDDING" && typeof payload.content === "string") {
        result = await ingestKnowledgeDocument({
          title: String(payload.title ?? "Documento"),
          sourceType: String(payload.sourceType ?? "manual"),
          sourceId: String(payload.sourceId ?? job.id),
          locale: String(payload.locale ?? "pt-BR"),
          content: payload.content,
        });
      } else if (job.type === "MODERATION_BATCH" && Array.isArray(payload.items)) {
        const decisions = [];
        for (const item of payload.items as { id: string; content: string; sourceType?: string }[]) {
          const mod = await moderateContent(item.content);
          await prisma.aIModerationQueue.create({
            data: {
              sourceType: item.sourceType ?? "unknown",
              sourceId: item.id,
              content: item.content.slice(0, 8000),
              decision: mod.decision,
              categories: mod.categories,
              status: mod.decision === "REVIEW" ? "PENDING" : mod.decision === "BLOCK" ? "BLOCKED" : "RESOLVED",
            },
          });
          decisions.push({ id: item.id, decision: mod.decision });
        }
        result = { decisions };
      } else if (job.type === "EMBED_QUERY" && typeof payload.text === "string") {
        result = await createEmbeddings([payload.text]);
      } else {
        result = { skipped: true, reason: "UNKNOWN_TYPE" };
      }

      await prisma.aIJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          result: result as Prisma.InputJsonValue,
          finishedAt: new Date(),
        },
      });
      results.push({ id: job.id, ok: true });
    } catch (e) {
      await prisma.aIJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: e instanceof Error ? e.message.slice(0, 500) : "erro",
          finishedAt: new Date(),
        },
      });
      results.push({ id: job.id, ok: false });
    }
  }
  return results;
}

export async function enqueueAiJob(input: {
  userId?: string;
  role?: string;
  type: string;
  payload: Record<string, unknown>;
}) {
  return prisma.aIJob.create({
    data: {
      userId: input.userId,
      role: input.role,
      type: input.type,
      status: "PENDING",
      payload: input.payload as Prisma.InputJsonValue,
    },
  });
}
