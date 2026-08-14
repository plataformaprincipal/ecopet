import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deriveIdempotencyKey, isMutatingAiTool } from "./tool-idempotency-utils";

export { deriveIdempotencyKey, isMutatingAiTool };

const WINDOW_MS = 10 * 60_000;

type PriorWrite = {
  duplicate: boolean;
  result?: unknown;
};

/**
 * Impede execução duplicada de writes confirmados (double-click / retry).
 * Usa AIToolExecution.metadata.idempotencyKey — sem expor secrets.
 */
export async function findPriorConfirmedWrite(input: {
  userId: string;
  toolName: string;
  idempotencyKey: string;
}): Promise<PriorWrite> {
  if (!isMutatingAiTool(input.toolName)) return { duplicate: false };

  const since = new Date(Date.now() - WINDOW_MS);
  const rows = await prisma.aIToolExecution.findMany({
    where: {
      userId: input.userId,
      toolName: input.toolName,
      success: true,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { metadata: true },
  });

  for (const row of rows) {
    const meta = row.metadata as { idempotencyKey?: string; result?: unknown } | null;
    if (meta?.idempotencyKey === input.idempotencyKey) {
      return { duplicate: true, result: meta.result };
    }
  }
  return { duplicate: false };
}

export async function recordConfirmedWrite(input: {
  userId: string;
  toolName: string;
  idempotencyKey: string;
  result: unknown;
  latencyMs?: number;
  conversationId?: string;
}): Promise<void> {
  const metadata: Prisma.InputJsonValue = {
    idempotencyKey: input.idempotencyKey,
    result: sanitizeResultForLog(input.result) as Prisma.InputJsonValue,
  };

  await prisma.aIToolExecution
    .create({
      data: {
        userId: input.userId,
        conversationId: input.conversationId ?? null,
        toolName: input.toolName,
        module: "ecopet-ai",
        success: true,
        latencyMs: input.latencyMs ?? 0,
        metadata,
      },
    })
    .catch(() => undefined);
}

function sanitizeResultForLog(result: unknown): Prisma.InputJsonValue {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return typeof result === "string" ? result.slice(0, 200) : (result as Prisma.InputJsonValue);
  }
  const out: Record<string, Prisma.InputJsonValue> = {};
  for (const [k, v] of Object.entries(result as Record<string, unknown>).slice(0, 12)) {
    if (typeof v === "string") out[k] = v.slice(0, 200);
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return out;
}
