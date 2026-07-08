import { prisma } from "@/lib/prisma";
import { loadMemory, listUserMemorySessions } from "@/lib/ai/memory/store";
import type { AiMemoryContext } from "@/lib/ai/types";

export type ClientPetMemory = {
  petId: string;
  petName: string;
  memory: AiMemoryContext;
};

export type ClientAiMemoryPanel = {
  user: {
    preferences: Record<string, unknown>;
    habits: string[];
    goals: string[];
    restrictions: string[];
    summary: string;
    lastQuestions: string[];
    lastCommands: string[];
  };
  pets: ClientPetMemory[];
  conversations: Array<{
    id: string;
    title: string | null;
    agentName: string | null;
    messageCount: number;
    updatedAt: string;
  }>;
};

export async function buildClientAiMemory(userId: string): Promise<ClientAiMemoryPanel> {
  const userMemory = await loadMemory({
    userId,
    scope: "user",
    scopeOwnerId: userId,
    agentType: "client",
  });

  const pets = await prisma.pet.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const petMemories: ClientPetMemory[] = await Promise.all(
    pets.map(async (pet) => ({
      petId: pet.id,
      petName: pet.name,
      memory: await loadMemory({
        userId,
        scope: "pet",
        scopeOwnerId: pet.id,
        petId: pet.id,
        agentType: "pet",
      }),
    }))
  );

  const conversations = await prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      agent: { select: { name: true } },
      _count: { select: { messages: true } },
    },
  });

  const sessions = await listUserMemorySessions(userId, 10);
  const habits = extractFromSessions(sessions, "habits");
  const goals = extractFromSessions(sessions, "goals");
  const restrictions = extractFromSessions(sessions, "restrictions");

  const prefs = userMemory.preferences as {
    habits?: string[];
    goals?: string[];
    restrictions?: string[];
  };

  return {
    user: {
      preferences: userMemory.preferences,
      habits: prefs.habits ?? habits,
      goals: prefs.goals ?? goals,
      restrictions: prefs.restrictions ?? restrictions,
      summary: userMemory.summary,
      lastQuestions: userMemory.lastQuestions,
      lastCommands: userMemory.lastCommands,
    },
    pets: petMemories.map((p) => ({
      petId: p.petId,
      petName: p.petName,
      memory: {
        ...p.memory,
        summary: p.memory.summary,
        preferences: p.memory.preferences,
        lastQuestions: p.memory.lastQuestions,
        lastCommands: p.memory.lastCommands,
      },
    })),
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      agentName: c.agent?.name ?? null,
      messageCount: c._count.messages,
      updatedAt: c.updatedAt.toISOString(),
    })),
  };
}

function extractFromSessions(
  sessions: Array<{ messages: unknown }>,
  key: "habits" | "goals" | "restrictions"
): string[] {
  const out: string[] = [];
  for (const s of sessions) {
    const m = s.messages as { preferences?: Record<string, string[]> } | null;
    const list = m?.preferences?.[key];
    if (Array.isArray(list)) out.push(...list);
  }
  return [...new Set(out)].slice(0, 10);
}
