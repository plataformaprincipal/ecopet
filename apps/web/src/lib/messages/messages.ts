import type { MessageType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MESSAGE_EDIT_WINDOW_MS,
  MESSAGE_MAX_LENGTH,
  MESSAGE_RATE_LIMIT_MAX,
  MESSAGE_RATE_LIMIT_WINDOW_MS,
  DEFAULT_PAGE_SIZE,
} from "@/lib/messages/constants";
import {
  assertCanSendMessage,
  assertConversationParticipant,
  requireChatUser,
} from "@/lib/messages/permissions";
import { auditChatAction, notifyNewMessage } from "@/lib/messages/notifications";
import { ChatError } from "@/lib/messages/utils";

const senderSelect = { id: true, name: true, role: true, avatarUrl: true } as const;

function sanitizeMessageContent(content: string, deletedAt: Date | null) {
  if (deletedAt) return "[Mensagem removida]";
  return content;
}

export function serializeMessage(message: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sender: { id: string; name: string; role: string; avatarUrl: string | null };
  attachments?: Array<{
    id: string;
    url: string;
    fileName: string;
    mimeType: string | null;
    size: number | null;
    storageProvider: string | null;
  }>;
  reactions?: Array<{ id: string; userId: string; emoji: string }>;
}) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    sender: message.sender,
    type: message.type,
    content: sanitizeMessageContent(message.content, message.deletedAt),
    isDeleted: Boolean(message.deletedAt),
    isEdited: Boolean(message.editedAt),
    editedAt: message.editedAt,
    createdAt: message.createdAt,
    attachments: message.attachments ?? [],
    reactions: message.reactions ?? [],
  };
}

export async function listMessages(params: {
  conversationId: string;
  userId: string;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
}) {
  await assertConversationParticipant(params.conversationId, params.userId);
  const limit = Math.min(100, Math.max(1, params.limit ?? DEFAULT_PAGE_SIZE));
  const order = params.order ?? "desc";

  const where: Prisma.MessageWhereInput = { conversationId: params.conversationId };
  if (params.cursor) {
    const cursorMsg = await prisma.message.findUnique({ where: { id: params.cursor } });
    if (cursorMsg) {
      where.createdAt = order === "desc" ? { lt: cursorMsg.createdAt } : { gt: cursorMsg.createdAt };
    }
  }

  const rows = await prisma.message.findMany({
    where,
    orderBy: { createdAt: order },
    take: limit,
    include: {
      sender: { select: senderSelect },
      attachments: true,
      reactions: true,
    },
  });

  return {
    items: rows.map(serializeMessage),
    nextCursor: rows.length === limit ? rows[rows.length - 1]?.id : null,
  };
}

async function assertRateLimit(senderId: string, conversationId: string) {
  const since = new Date(Date.now() - MESSAGE_RATE_LIMIT_WINDOW_MS);
  const count = await prisma.message.count({
    where: { senderId, conversationId, createdAt: { gte: since } },
  });
  if (count >= MESSAGE_RATE_LIMIT_MAX) {
    throw new ChatError("Muitas mensagens em pouco tempo. Aguarde.", "RATE_LIMIT", 429);
  }
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content?: string;
  type?: MessageType;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    storageProvider: string;
  }>;
}) {
  await assertCanSendMessage(params.conversationId, params.senderId);
  await assertRateLimit(params.senderId, params.conversationId);

  const content = (params.content ?? "").trim();
  const hasAttachments = (params.attachments?.length ?? 0) > 0;

  if (!content && !hasAttachments) {
    throw new ChatError("Mensagem vazia.", "VALIDATION", 400);
  }
  if (content.length > MESSAGE_MAX_LENGTH) {
    throw new ChatError(`Mensagem excede ${MESSAGE_MAX_LENGTH} caracteres.`, "VALIDATION", 400);
  }

  const type = params.type ?? (hasAttachments ? "FILE" : "TEXT");
  const now = new Date();

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: params.conversationId,
        senderId: params.senderId,
        content: content || (hasAttachments ? "[Anexo]" : ""),
        type,
        attachments: hasAttachments
          ? {
              create: params.attachments!.map((a) => ({
                url: a.fileUrl,
                fileName: a.fileName,
                mimeType: a.mimeType,
                size: a.fileSize,
                storageProvider: a.storageProvider,
              })),
            }
          : undefined,
      },
      include: {
        sender: { select: senderSelect },
        attachments: true,
        reactions: true,
      },
    });

    await tx.conversation.update({
      where: { id: params.conversationId },
      data: { lastMessageAt: now, updatedAt: now, status: "ACTIVE" },
    });

    return created;
  });

  const sender = await requireChatUser(params.senderId);
  const recipients = await prisma.conversationParticipant.findMany({
    where: { conversationId: params.conversationId, userId: { not: params.senderId }, leftAt: null },
    select: { userId: true },
  });

  await Promise.all(
    recipients.map((r) =>
      notifyNewMessage({
        recipientId: r.userId,
        senderName: sender.name,
        conversationId: params.conversationId,
        messageId: message.id,
        preview: message.content,
      }).catch(() => undefined)
    )
  );

  await auditChatAction({
    actorId: params.senderId,
    action: "CREATE",
    resource: "message",
    resourceId: message.id,
    entityAfter: { conversationId: params.conversationId, type },
  });

  return serializeMessage(message);
}

export async function editMessage(messageId: string, userId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw new ChatError("Conteúdo obrigatório.", "VALIDATION", 400);
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    throw new ChatError(`Mensagem excede ${MESSAGE_MAX_LENGTH} caracteres.`, "VALIDATION", 400);
  }

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.deletedAt) throw new ChatError("Mensagem não encontrada.", "NOT_FOUND", 404);
  if (message.senderId !== userId) {
    throw new ChatError("Só o autor pode editar.", "FORBIDDEN", 403);
  }
  if (Date.now() - message.createdAt.getTime() > MESSAGE_EDIT_WINDOW_MS) {
    throw new ChatError("Prazo para edição expirou.", "FORBIDDEN", 403);
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: trimmed, editedAt: new Date() },
    include: { sender: { select: senderSelect }, attachments: true, reactions: true },
  });

  return serializeMessage(updated);
}

export async function deleteMessage(messageId: string, userId: string, isAdmin = false, reason?: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.deletedAt) throw new ChatError("Mensagem não encontrada.", "NOT_FOUND", 404);
  if (message.senderId !== userId && !isAdmin) {
    throw new ChatError("Sem permissão para apagar.", "FORBIDDEN", 403);
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: "[Mensagem removida]" },
    include: { sender: { select: senderSelect }, attachments: true, reactions: true },
  });

  await auditChatAction({
    actorId: userId,
    action: "DELETE",
    resource: "message",
    resourceId: messageId,
    observation: reason,
    entityBefore: { content: message.content },
  });

  return serializeMessage(updated);
}

export async function addReaction(messageId: string, userId: string, emoji: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new ChatError("Mensagem não encontrada.", "NOT_FOUND", 404);
  await assertConversationParticipant(message.conversationId, userId);

  return prisma.messageReaction.upsert({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
    create: { messageId, userId, emoji },
    update: {},
  });
}

export async function removeReaction(messageId: string, userId: string, emoji: string) {
  await prisma.messageReaction.deleteMany({ where: { messageId, userId, emoji } });
  return { ok: true };
}

export async function reportMessage(params: {
  messageId: string;
  reporterId: string;
  reason: string;
  description?: string;
}) {
  const message = await prisma.message.findUnique({ where: { id: params.messageId } });
  if (!message) throw new ChatError("Mensagem não encontrada.", "NOT_FOUND", 404);
  await assertConversationParticipant(message.conversationId, params.reporterId);

  const report = await prisma.messageReport.create({
    data: {
      messageId: params.messageId,
      conversationId: message.conversationId,
      reporterId: params.reporterId,
      reason: params.reason,
      description: params.description,
    },
  });

  await auditChatAction({
    actorId: params.reporterId,
    action: "CREATE",
    resource: "message_report",
    resourceId: report.id,
  });

  return report;
}
