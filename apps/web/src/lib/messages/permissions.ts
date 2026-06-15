import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ChatError } from "@/lib/messages/utils";

export type ChatUser = {
  id: string;
  role: UserRole;
  accountStatus: AccountStatus;
  name: string;
  email: string;
};

export async function requireChatUser(userId: string): Promise<ChatUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, accountStatus: true, name: true, email: true },
  });
  if (!user) throw new ChatError("Usuário não encontrado.", "NOT_FOUND", 404);
  if (user.accountStatus === "SUSPENDED") {
    throw new ChatError("Conta suspensa.", "ACCOUNT_SUSPENDED", 403);
  }
  if (user.accountStatus === "REJECTED") {
    throw new ChatError("Conta rejeitada.", "ACCOUNT_REJECTED", 403);
  }
  return user;
}

export async function requireActiveChatUser(userId: string): Promise<ChatUser> {
  const user = await requireChatUser(userId);
  if (user.accountStatus !== "ACTIVE") {
    throw new ChatError("Conta precisa estar ativa para usar mensagens.", "ACCOUNT_NOT_ACTIVE", 403);
  }
  return user;
}

export async function assertConversationParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: { conversation: true },
  });
  if (!participant || participant.leftAt) {
    throw new ChatError("Você não participa desta conversa.", "FORBIDDEN", 403);
  }
  return participant;
}

export async function assertCanSendMessage(conversationId: string, senderId: string) {
  const participant = await assertConversationParticipant(conversationId, senderId);
  const conversation = participant.conversation;

  if (conversation.status === "CLOSED" || conversation.status === "BLOCKED") {
    throw new ChatError("Conversa encerrada ou bloqueada.", "CONVERSATION_CLOSED", 403);
  }
  if (participant.isBlocked) {
    throw new ChatError("Conversa bloqueada para você.", "CONVERSATION_BLOCKED", 403);
  }

  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: senderId }, leftAt: null },
    select: { userId: true },
  });

  for (const other of otherParticipants) {
    const blocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: other.userId, blockedId: senderId },
          { blockerId: senderId, blockedId: other.userId },
        ],
      },
    });
    if (blocked) {
      throw new ChatError("Não é possível enviar mensagem — bloqueio ativo.", "USER_BLOCKED", 403);
    }
  }

  return participant;
}

export async function assertAdmin(userId: string) {
  const user = await requireChatUser(userId);
  if (user.role !== "ADMIN") {
    throw new ChatError("Acesso restrito a administradores.", "FORBIDDEN", 403);
  }
  return user;
}
