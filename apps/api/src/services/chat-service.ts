import { prisma } from "@ecopet/database";
import type { ConversationType, MessageType } from "@prisma/client";
import { asOptionalInputJson } from "../lib/prisma-json.js";

export async function getUserConversations(userId: string) {
  return prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function getConversationMessages(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw new Error("FORBIDDEN");

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
      participants: {
        create: uniqueIds.map((userId) => ({ userId })),
      },
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
}) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: params.conversationId, userId: params.senderId },
    },
  });
  if (!participant) throw new Error("FORBIDDEN");

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

  return message;
}

export async function findOrCreateEcopetSupport(userId: string) {
  const gestor = await prisma.user.findFirst({
    where: { role: { in: ["GESTOR", "ADMIN"] }, accountStatus: "ACTIVE" },
  });
  if (!gestor) throw new Error("NO_GESTOR");

  const existing = await prisma.conversation.findFirst({
    where: {
      type: "CLIENT_ECOPET",
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: gestor.id } } },
      ],
    },
  });
  if (existing) return existing;

  return createConversation({
    type: "CLIENT_ECOPET",
    title: "Suporte ECOPET",
    participantIds: [userId, gestor.id],
    creatorId: userId,
  });
}
