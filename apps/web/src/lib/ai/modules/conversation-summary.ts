import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { truncateToTokenBudget } from "./token-manager";

/** Resumo extrativo incremental (sem chamada LLM extra). */
export function buildExtractiveSummary(
  previous: string,
  userMessage: string,
  assistantMessage: string
): string {
  const bulletUser = userMessage.trim().replace(/\s+/g, " ").slice(0, 140);
  const bulletAsst = assistantMessage.trim().replace(/\s+/g, " ").slice(0, 180);
  const next = [previous.trim(), `U: ${bulletUser}`, `A: ${bulletAsst}`]
    .filter(Boolean)
    .join("\n");
  return truncateToTokenBudget(next, 400);
}

/**
 * Atualiza AIConversation.summary e o campo summary no AiSession
 * sem duplicar mensagens no histórico (saveMemory fica no stream).
 */
export async function updateConversationSummary(input: {
  userId: string;
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  petId?: string;
}): Promise<string> {
  const conv = await prisma.aIConversation.findFirst({
    where: { id: input.conversationId, userId: input.userId, deletedAt: null },
    select: { id: true, summary: true },
  });
  if (!conv) return "";

  const summary = buildExtractiveSummary(
    conv.summary ?? "",
    input.userMessage,
    input.assistantMessage
  );

  await prisma.aIConversation
    .update({
      where: { id: conv.id },
      data: { summary },
    })
    .catch(() => undefined);

  const session = await prisma.aiSession.findFirst({
    where: {
      userId: input.userId,
      type: "ai:user:client",
      ...(input.petId ? { petId: input.petId } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  if (session) {
    const prev = (session.messages ?? {}) as Record<string, unknown>;
    const preferences =
      typeof prev.preferences === "object" && prev.preferences
        ? { ...(prev.preferences as Record<string, unknown>) }
        : {};
    preferences.__summary = summary;
    await prisma.aiSession
      .update({
        where: { id: session.id },
        data: {
          messages: {
            ...prev,
            summary,
            preferences,
          } as Prisma.InputJsonValue,
        },
      })
      .catch(() => undefined);
  }

  return summary;
}
