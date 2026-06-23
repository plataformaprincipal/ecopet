import type { ConversationContextType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notification-service";
import { ChatError } from "@/lib/messages/utils";
import { requireActiveChatUser } from "@/lib/messages/permissions";
import { resolveConversationTypeForRoles } from "@/lib/messages/utils";
import {
  assertPersonaCanMessage,
  buildTalkJsConversationId,
  isTalkJsServerConfigured,
  syncTalkJsConversation,
  syncTalkJsUser,
} from "@/lib/talkjs/server";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  accountStatus: true,
} as const;

export async function createOrGetTalkJsConversation(params: {
  creatorId: string;
  participantUserId: string;
  contextType?: ConversationContextType;
  contextId?: string | null;
  title?: string;
}) {
  const creator = await prisma.user.findUnique({
    where: { id: params.creatorId },
    select: userSelect,
  });
  if (!creator || creator.accountStatus !== "ACTIVE") {
    throw new ChatError("Conta precisa estar ativa para usar mensagens.", "ACCOUNT_NOT_ACTIVE", 403);
  }
  const contextType = params.contextType ?? "GENERAL";
  const contextId = params.contextId ?? null;

  if (params.participantUserId === creator.id) {
    throw new ChatError("Não é possível iniciar conversa consigo mesmo.", "VALIDATION", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: params.participantUserId },
    select: userSelect,
  });

  if (!target) throw new ChatError("Participante inválido.", "VALIDATION", 400);
  if (target.accountStatus !== "ACTIVE") {
    throw new ChatError(`${target.name} não está com conta ativa.`, "ACCOUNT_NOT_ACTIVE", 403);
  }

  if (!assertPersonaCanMessage(creator.role, target.role)) {
    throw new ChatError("Combinação de perfis não permitida.", "FORBIDDEN", 403);
  }

  const talkjsConversationId = buildTalkJsConversationId({
    contextType,
    contextId: contextId ?? "general",
    userAId: creator.id,
    userBId: target.id,
  });

  const existing = await prisma.conversation.findUnique({
    where: { talkjsConversationId },
    include: { participants: { include: { user: { select: userSelect } } } },
  });

  if (existing) {
    const isParticipant = existing.participants.some((p) => p.userId === creator.id && !p.leftAt);
    if (!isParticipant) {
      throw new ChatError("Você não participa desta conversa.", "FORBIDDEN", 403);
    }
    return { conversation: existing, created: false };
  }

  const type = resolveConversationTypeForRoles(creator.role, target.role);
  const conversation = await prisma.conversation.create({
    data: {
      type,
      title: params.title,
      status: "ACTIVE",
      createdById: creator.id,
      talkjsConversationId,
      contextType,
      contextId,
      participants: {
        create: [
          { userId: creator.id, roleSnapshot: creator.role, joinedAt: new Date() },
          { userId: target.id, roleSnapshot: target.role, joinedAt: new Date() },
        ],
      },
    },
    include: { participants: { include: { user: { select: userSelect } } } },
  });

  if (isTalkJsServerConfigured()) {
    await syncTalkJsUser({
      id: creator.id,
      name: creator.name,
      email: creator.email,
      photoUrl: creator.avatarUrl,
      role: creator.role,
    });
    await syncTalkJsUser({
      id: target.id,
      name: target.name,
      email: target.email,
      photoUrl: target.avatarUrl,
      role: target.role,
    });
    await syncTalkJsConversation({
      conversationId: talkjsConversationId,
      participantIds: [creator.id, target.id],
      subject: params.title,
      contextType,
      contextId,
      ecopetConversationId: conversation.id,
    });
  }

  await createNotification({
    userId: target.id,
    type: "MESSAGE",
    title: "Nova conversa",
    message: `${creator.name} iniciou uma conversa com você.`,
    actionUrl: `/dashboard/messages/${conversation.id}`,
    metadata: {
      conversationId: conversation.id,
      talkjsConversationId,
      contextType,
      contextId,
    },
  });

  return { conversation, created: true };
}

export async function listTalkJsConversations(userId: string) {
  await requireActiveChatUser(userId);
  const rows = await prisma.conversation.findMany({
    where: {
      talkjsConversationId: { not: null },
      participants: { some: { userId, leftAt: null } },
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      participants: { include: { user: { select: userSelect } } },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    talkjsConversationId: c.talkjsConversationId,
    contextType: c.contextType,
    contextId: c.contextId,
    type: c.type,
    title: c.title,
    lastMessageAt: c.lastMessageAt,
    participants: c.participants
      .filter((p) => p.userId !== userId)
      .map((p) => ({
        id: p.userId,
        name: p.user.name,
        role: p.user.role,
        avatarUrl: p.user.avatarUrl,
      })),
  }));
}
