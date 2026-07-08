import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { AiLogRecord, AiTokenUsageRecord } from "@/lib/ai/types";

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAiPlatformLog(record: AiLogRecord): Promise<string> {
  const [platformLog] = await prisma.$transaction([
    prisma.aILog.create({
      data: {
        userId: record.userId,
        prompt: record.prompt,
        response: record.response,
        tokensInput: record.promptTokens,
        tokensOutput: record.completionTokens,
        durationMs: record.durationMs,
        errorCode: record.errorCode,
        errorMessage: record.errorMessage,
        conversationId: record.conversationId,
        result: toJson({
          agentId: record.agentId,
          provider: record.provider,
          estimatedCostUsd: record.estimatedCostUsd,
          ...record.metadata,
        }),
      },
    }),
    prisma.aIChatLog.create({
      data: {
        userId: record.userId,
        prompt: record.prompt,
        response: record.response ?? "",
        model: record.model,
        metadata: toJson({
          agentId: record.agentId,
          provider: record.provider,
          promptTokens: record.promptTokens,
          completionTokens: record.completionTokens,
          totalTokens: record.totalTokens,
          durationMs: record.durationMs,
          estimatedCostUsd: record.estimatedCostUsd,
          errorCode: record.errorCode,
          errorMessage: record.errorMessage,
        }),
      },
    }),
  ]);

  if (record.totalTokens > 0) {
    await writeTokenUsage({
      userId: record.userId,
      model: record.model,
      provider: record.provider,
      project: record.agentId,
      tokensInput: record.promptTokens,
      tokensOutput: record.completionTokens,
      estimatedCost: record.estimatedCostUsd,
    });
  }

  return platformLog.id;
}

export async function writeTokenUsage(record: AiTokenUsageRecord) {
  await prisma.aITokenUsage.create({
    data: {
      userId: record.userId,
      project: record.project,
      tokensInput: record.tokensInput,
      tokensOutput: record.tokensOutput,
      estimatedCost: record.estimatedCost,
    },
  });
}

export async function listPlatformLogs(params: {
  userId?: string;
  limit?: number;
  adminView?: boolean;
}) {
  const limit = Math.min(params.limit ?? 50, 100);
  return prisma.aILog.findMany({
    where: params.userId ? { userId: params.userId } : params.adminView ? {} : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getPlatformLogStats(userId?: string) {
  const logs = await prisma.aILog.findMany({
    where: userId ? { userId } : {},
    select: { tokensInput: true, tokensOutput: true, result: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  let totalTokens = 0;
  let totalCost = 0;
  const byAgent: Record<string, number> = {};

  for (const log of logs) {
    totalTokens += log.tokensInput + log.tokensOutput;
    const meta = (log.result ?? {}) as { estimatedCostUsd?: number; agentId?: string };
    totalCost += meta.estimatedCostUsd ?? 0;
    if (meta.agentId) byAgent[meta.agentId] = (byAgent[meta.agentId] ?? 0) + 1;
  }

  return { totalRequests: logs.length, totalTokens, totalCostUsd: totalCost, byAgent };
}

export async function listTokenUsage(params: { userId?: string; limit?: number }) {
  return prisma.aITokenUsage.findMany({
    where: params.userId ? { userId: params.userId } : {},
    orderBy: { usageDate: "desc" },
    take: Math.min(params.limit ?? 100, 200),
  });
}

export async function listConversations(userId: string, limit = 20) {
  return prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { agent: { select: { code: true, name: true } }, _count: { select: { messages: true } } },
  });
}

export async function listFeedbacks(userId?: string, limit = 50) {
  return prisma.aIFeedback.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
