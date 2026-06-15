import type { ConversationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/messages/constants";
import {
  assertConversationParticipant,
  requireActiveChatUser,
} from "@/lib/messages/permissions";
import {
  ChatError,
  directConversationKey,
  isRolePairAllowed,
  resolveConversationTypeForRoles,
} from "@/lib/messages/utils";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  accountStatus: true,
} as const;

export async function listUserConversations(params: {
  userId: string;
  type?: ConversationType;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireActiveChatUser(params.userId);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ConversationWhereInput = {
    participants: {
      some: {
        userId: params.userId,
        leftAt: null,
        isArchived: false,
      },
    },
    ...(params.type ? { type: params.type } : {}),
    ...(params.q
      ? {
          OR: [
            { title: { contains: params.q, mode: "insensitive" } },
            {
              participants: {
                some: {
                  user: { name: { contains: params.q, mode: "insensitive" } },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      skip,
      take: pageSize,
      include: {
        participants: { include: { user: { select: userSelect } } },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  const items = await Promise.all(
    rows.map(async (c) => {
      const me = c.participants.find((p) => p.userId === params.userId);
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          deletedAt: null,
          senderId: { not: params.userId },
          createdAt: me?.lastReadAt ? { gt: me.lastReadAt } : undefined,
        },
      });
      const last = c.messages[0];
      return {
        id: c.id,
        type: c.type,
        status: c.status,
        title: c.title,
        lastMessageAt: c.lastMessageAt,
        unreadCount,
        lastMessage: last
          ? {
              id: last.id,
              content: last.content,
              type: last.type,
              senderId: last.senderId,
              senderName: last.sender.name,
              createdAt: last.createdAt,
            }
          : null,
        participants: c.participants.map((p) => ({
          id: p.userId,
          name: p.user.name,
          role: p.user.role,
          avatarUrl: p.user.avatarUrl,
          isMuted: p.isMuted,
          isArchived: p.isArchived,
        })),
      };
    })
  );

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getConversationDetail(conversationId: string, userId: string) {
  await assertConversationParticipant(conversationId, userId);
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { include: { user: { select: userSelect } } },
      ticket: true,
    },
  });
  if (!conversation) throw new ChatError("Conversa não encontrada.", "NOT_FOUND", 404);

  const me = conversation.participants.find((p) => p.userId === userId);
  return {
    ...conversation,
    permissions: {
      canSend: conversation.status !== "CLOSED" && conversation.status !== "BLOCKED" && !me?.isBlocked,
      canArchive: true,
      canMute: true,
      canBlock: conversation.type === "DIRECT",
    },
  };
}

async function findExistingDirect(userA: string, userB: string) {
  const key = directConversationKey(userA, userB);
  return prisma.conversation.findUnique({
    where: { directKey: key },
    include: { participants: { include: { user: { select: userSelect } } } },
  });
}

export async function createConversation(params: {
  creatorId: string;
  type?: ConversationType;
  title?: string;
  participantUserIds: string[];
}) {
  const creator = await requireActiveChatUser(params.creatorId);
  const uniqueTargets = [...new Set(params.participantUserIds.filter((id) => id !== params.creatorId))];

  if (uniqueTargets.length === 0) {
    throw new ChatError("Informe pelo menos um participante.", "VALIDATION", 400);
  }

  const participants = await prisma.user.findMany({
    where: { id: { in: uniqueTargets } },
    select: { id: true, role: true, accountStatus: true, name: true },
  });

  if (participants.length !== uniqueTargets.length) {
    throw new ChatError("Participante inválido.", "VALIDATION", 400);
  }

  for (const p of participants) {
    if (p.accountStatus !== "ACTIVE") {
      throw new ChatError(`${p.name} não está com conta ativa.`, "ACCOUNT_NOT_ACTIVE", 403);
    }
  }

  const allIds = [creator.id, ...uniqueTargets];
  const allRoles = [creator.role, ...participants.map((p) => p.role)];

  const type =
    params.type ??
    (uniqueTargets.length === 1
      ? resolveConversationTypeForRoles(creator.role, participants[0].role)
      : "DIRECT");

  if (type === "DIRECT" && uniqueTargets.length !== 1) {
    throw new ChatError("Direct aceita exatamente um destinatário.", "VALIDATION", 400);
  }

  if (!isRolePairAllowed(type, allRoles)) {
    throw new ChatError("Combinação de perfis não permitida.", "FORBIDDEN", 403);
  }

  if (type === "DIRECT") {
    const existing = await findExistingDirect(creator.id, uniqueTargets[0]);
    if (existing) return existing;
  }

  const directKey = type === "DIRECT" ? directConversationKey(creator.id, uniqueTargets[0]) : null;

  return prisma.conversation.create({
    data: {
      type,
      title: params.title,
      status: "ACTIVE",
      createdById: creator.id,
      directKey,
      participants: {
        create: allIds.map((userId) => {
          const user = userId === creator.id ? creator : participants.find((p) => p.id === userId);
          return {
            userId,
            roleSnapshot: user?.role ?? null,
            joinedAt: new Date(),
          };
        }),
      },
    },
    include: { participants: { include: { user: { select: userSelect } } } },
  });
}

export async function setParticipantFlag(
  conversationId: string,
  userId: string,
  flag: "isArchived" | "isMuted" | "isBlocked",
  value: boolean
) {
  await assertConversationParticipant(conversationId, userId);
  return prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { [flag]: value },
  });
}

export async function markConversationRead(conversationId: string, userId: string) {
  await assertConversationParticipant(conversationId, userId);
  const now = new Date();
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: now },
  });
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, read: false },
    data: { read: true },
  });
  return { lastReadAt: now };
}
