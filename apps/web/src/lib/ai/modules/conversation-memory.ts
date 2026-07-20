import "server-only";

import { loadMemory, saveMemory } from "@/lib/ai/memory/store";
import { prisma } from "@/lib/prisma";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { buildSlidingWindow, truncateToTokenBudget } from "./token-manager";

export type ActiveConversationMemory = {
  shortTerm: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  longTermSummary: string;
  activeContext: string;
};

export async function loadActiveConversationMemory(input: {
  userId: string;
  petId?: string;
  conversationId?: string;
}): Promise<ActiveConversationMemory> {
  const memory = await loadMemory({
    userId: input.userId,
    scope: "user",
    scopeOwnerId: input.userId,
    petId: input.petId,
    agentType: "client",
  });

  let longTermSummary = "";
  if (typeof memory.preferences?.__summary === "string") {
    longTermSummary = memory.preferences.__summary;
  }

  if (input.conversationId) {
    const conv = await prisma.aIConversation.findFirst({
      where: { id: input.conversationId, userId: input.userId, deletedAt: null },
      select: { summary: true },
    });
    if (conv?.summary) longTermSummary = conv.summary;
  }

  const shortTerm = buildSlidingWindow(
    memory.history.map((h) => ({
      role: h.role as "user" | "assistant" | "system",
      content: h.content,
    })),
    AI_CONFIG.maxHistoryMessages,
    2_500
  );

  const activeContext = truncateToTokenBudget(
    [
      longTermSummary ? `Resumo da conversa:\n${longTermSummary}` : "",
      memory.lastQuestions?.length
        ? `Perguntas recentes: ${memory.lastQuestions.slice(-3).join(" | ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    500
  );

  return { shortTerm, longTermSummary, activeContext };
}

export async function persistConversationTurn(input: {
  userId: string;
  petId?: string;
  conversationId?: string;
  userMessage: string;
  assistantMessage: string;
}): Promise<void> {
  await saveMemory(
    {
      userId: input.userId,
      scope: "user",
      scopeOwnerId: input.userId,
      petId: input.petId,
      agentType: "client",
    },
    {
      userMessage: input.userMessage,
      assistantMessage: input.assistantMessage,
      conversationId: input.conversationId,
    }
  );
}

/** Limpeza: sessões AI antigas sem uso (retenção 90 dias). */
export async function cleanupStaleAiSessions(olderThanDays = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  const result = await prisma.aiSession.deleteMany({
    where: {
      type: { startsWith: "ai:" },
      updatedAt: { lt: cutoff },
    },
  });
  return result.count;
}
