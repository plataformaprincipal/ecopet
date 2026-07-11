import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { AiMemoryContext, AiMemoryEntry, AiMemoryScope } from "@/lib/ai/types";

const MAX_HISTORY = 20;
const MAX_LAST = 5;

type MemoryKey = {
  userId: string;
  scope: AiMemoryScope;
  scopeOwnerId: string;
  petId?: string;
  agentType: string;
};

function sessionType(key: MemoryKey) {
  return `ai:${key.scope}:${key.agentType}`;
}

function parseMessages(raw: unknown): AiMemoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is AiMemoryEntry => typeof m === "object" && m !== null && "role" in m && "content" in m)
    .slice(-MAX_HISTORY);
}

export async function loadMemory(key: MemoryKey): Promise<AiMemoryContext> {
  const session = await prisma.aiSession.findFirst({
    where: {
      userId: key.userId,
      type: sessionType(key),
      ...(key.petId ? { petId: key.petId } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const payload = (session?.messages ?? {}) as {
    summary?: string;
    history?: AiMemoryEntry[];
    preferences?: Record<string, unknown>;
    lastConversation?: string | null;
    lastQuestions?: string[];
    lastCommands?: string[];
    lastResults?: string[];
  };

  return {
    scope: key.scope,
    ownerId: key.scopeOwnerId,
    petId: key.petId,
    summary: payload.summary ?? "",
    history: parseMessages(payload.history ?? []),
    preferences: payload.preferences ?? {},
    lastConversation: payload.lastConversation ?? null,
    lastQuestions: payload.lastQuestions ?? [],
    lastCommands: payload.lastCommands ?? [],
    lastResults: payload.lastResults ?? [],
  };
}

export async function saveMemory(
  key: MemoryKey,
  update: {
    userMessage: string;
    assistantMessage?: string | null;
    preferences?: Record<string, unknown>;
    conversationId?: string;
  }
): Promise<string> {
  const existing = await prisma.aiSession.findFirst({
    where: {
      userId: key.userId,
      type: sessionType(key),
      ...(key.petId ? { petId: key.petId } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date().toISOString();
  const prev = existing
    ? ((existing.messages as {
        summary?: string;
        history?: AiMemoryEntry[];
        preferences?: Record<string, unknown>;
        lastQuestions?: string[];
        lastCommands?: string[];
        lastResults?: string[];
        lastConversation?: string | null;
      }) ?? {})
    : {};

  const history: AiMemoryEntry[] = [
    ...(prev.history ?? []),
    { role: "user", content: update.userMessage, timestamp: now },
  ];
  if (update.assistantMessage) {
    history.push({ role: "assistant", content: update.assistantMessage, timestamp: now });
  }

  const messages = {
    summary: prev.summary ?? "",
    history: history.slice(-MAX_HISTORY),
    preferences: update.preferences ?? prev.preferences ?? {},
    lastConversation: update.conversationId ?? prev.lastConversation ?? null,
    lastQuestions: [...(prev.lastQuestions ?? []), update.userMessage].slice(-MAX_LAST),
    lastCommands: [...(prev.lastCommands ?? []), update.userMessage].slice(-MAX_LAST),
    lastResults: update.assistantMessage
      ? [...(prev.lastResults ?? []), update.assistantMessage].slice(-MAX_LAST)
      : prev.lastResults ?? [],
    scope: key.scope,
    scopeOwnerId: key.scopeOwnerId,
  } as Prisma.InputJsonValue;

  if (existing) {
    await prisma.aiSession.update({ where: { id: existing.id }, data: { messages, updatedAt: new Date() } });
    return existing.id;
  }

  const created = await prisma.aiSession.create({
    data: { userId: key.userId, petId: key.petId ?? null, type: sessionType(key), messages },
  });
  return created.id;
}

export async function createConversation(params: {
  userId: string;
  agentCode?: string;
  petId?: string;
  title?: string;
  module?: string;
  role?: string;
  locale?: string;
}) {
  let agentId: string | undefined;
  if (params.agentCode) {
    const agent = await prisma.aIAgent.findUnique({ where: { code: params.agentCode } });
    agentId = agent?.id;
  }
  return prisma.aIConversation.create({
    data: {
      userId: params.userId,
      agentId,
      petId: params.petId,
      title: params.title,
      module: params.module,
      role: params.role,
      locale: params.locale ?? "pt-BR",
    },
  });
}

export async function appendConversationMessage(params: {
  conversationId: string;
  role: string;
  content: string;
  tokensInput?: number;
  tokensOutput?: number;
}) {
  return prisma.aIMessage.create({
    data: {
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      tokensInput: params.tokensInput ?? 0,
      tokensOutput: params.tokensOutput ?? 0,
    },
  });
}

export async function listUserMemorySessions(userId: string, limit = 20) {
  return prisma.aiSession.findMany({
    where: { userId, type: { startsWith: "ai:" } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, type: true, petId: true, messages: true, createdAt: true, updatedAt: true },
  });
}
