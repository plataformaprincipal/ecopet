import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ToolExecutionResult } from "@/lib/ai/modules/types";

export async function logToolExecution(input: {
  userId?: string;
  conversationId?: string;
  result: ToolExecutionResult;
  module?: string;
}): Promise<void> {
  const metadata = {
    executed: input.result.executed,
    dataKeys:
      input.result.data && typeof input.result.data === "object"
        ? Object.keys(input.result.data as object).slice(0, 20)
        : [],
  } as Prisma.InputJsonValue;

  await prisma.aIToolExecution
    .create({
      data: {
        userId: input.userId ?? null,
        conversationId: input.conversationId ?? null,
        toolName: input.result.toolName,
        module: input.module ?? "ecopet-ai",
        success: input.result.ok && input.result.executed,
        latencyMs: input.result.latencyMs,
        errorCode: input.result.error ?? null,
        metadata,
      },
    })
    .catch(() => undefined);
}

export async function logToolExecutions(
  userId: string | undefined,
  conversationId: string | undefined,
  results: ToolExecutionResult[],
  module = "ecopet-ai"
): Promise<void> {
  for (const result of results) {
    await logToolExecution({ userId, conversationId, result, module });
  }
}

export async function listRecentToolExecutions(limit = 50) {
  return prisma.aIToolExecution
    .findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
      select: {
        id: true,
        userId: true,
        toolName: true,
        success: true,
        latencyMs: true,
        errorCode: true,
        createdAt: true,
      },
    })
    .catch(() => []);
}
