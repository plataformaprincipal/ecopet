import { prisma } from "@ecopet/database";
import type { ConversationType, MessageType } from "@prisma/client";
import { asOptionalInputJson } from "../lib/prisma-json.js";
import { generateChatAiReply, isAiEnabled } from "./ai-chat-service.js";
import { ensureEcopetAiUser } from "./chat-system-users.js";

export async function getUserConversations(userId: string) {
  const rows = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });

  return Promise.all(
    rows.map(async (c) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          read: false,
        },
      });
      const last = c.messages[0];
      return {
        ...c,
        lastMessage: last?.content ?? "",
        unreadCount,
      };
    })
  );
}

export async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw new Error("FORBIDDEN");
  return participant;
}

export async function getConversationMessages(conversationId: string, userId: string) {
  await assertParticipant(conversationId, userId);
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, avatar: true, role: true } },
      attachments: true,
    },
  });
}

export async function createConversation(params: {
  type: ConversationType;
  title?: string;
  participantIds: string[];
  creatorId: string;
}) {
  const uniqueIds = [...new Set([...params.participantIds, params.creatorId])];
  return prisma.conversation.create({
    data: {
      type: params.type,
      title: params.title,
      participants: { create: uniqueIds.map((userId) => ({ userId })) },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      },
    },
  });
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
  triggerAi?: boolean;
}) {
  await assertParticipant(params.conversationId, params.senderId);

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
  });

  const message = await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      senderId: params.senderId,
      content: params.content,
      type: params.type ?? "TEXT",
      metadata: asOptionalInputJson(params.metadata),
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true, role: true } },
      attachments: true,
    },
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });

  const shouldAi =
    params.triggerAi !== false &&
    isAiEnabled() &&
    conversation &&
    ["CLIENT_ECOPET", "PARTNER_ECOPET", "NGO_ECOPET"].includes(conversation.type);

  if (shouldAi) {
    const aiUser = await ensureEcopetAiUser();
    const { reply } = await generateChatAiReply({
      message: params.content,
      userId: params.senderId,
      conversationId: params.conversationId,
    });
    await prisma.message.create({
      data: {
        conversationId: params.conversationId,
        senderId: aiUser.id,
        content: reply,
        type: "AI",
        metadata: asOptionalInputJson({ autoReply: true }),
      },
    });
  }

  return message;
}

export async function markConversationRead(conversationId: string, userId: string) {
  await assertParticipant(conversationId, userId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, read: false },
    data: { read: true },
  });
  return { ok: true };
}

export async function findOrCreateEcopetSupport(userId: string) {
  const gestor = await prisma.user.findFirst({
    where: { role: { in: ["GESTOR", "ADMIN"] }, accountStatus: "ACTIVE" },
  });
  const aiUser = await ensureEcopetAiUser();
  const supportIds = [userId, aiUser.id, ...(gestor ? [gestor.id] : [])];

  const existing = await prisma.conversation.findFirst({
    where: {
      type: "CLIENT_ECOPET",
      participants: { some: { userId } },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
    },
  });
  if (existing) return existing;

  return createConversation({
    type: "CLIENT_ECOPET",
    title: "Suporte ECOPET",
    participantIds: supportIds,
    creatorId: userId,
  });
}
