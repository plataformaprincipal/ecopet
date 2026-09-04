import "server-only";

import type { ConversationContextType, ConversationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createConversation } from "@/lib/messages/conversations";
import { ChatError } from "@/lib/messages/utils";
import { requireActiveChatUser, canUseMessaging } from "@/lib/messages/permissions";
import { resolveMessagingUserId } from "@/lib/messages/resolve-participant";
import { resolveConversationTypeForRoles } from "@/lib/messages/utils";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  accountStatus: true,
} as const;

export type CommercialContext = {
  clientId?: string;
  partnerId?: string;
  petId?: string | null;
  productId?: string | null;
  serviceId?: string | null;
  description?: string | null;
  quantity?: number | null;
  deadline?: string | null;
  address?: string | null;
  attachments?: unknown;
};

async function findExistingClientPartner(userA: string, userB: string) {
  return prisma.conversation.findFirst({
    where: {
      type: "CLIENT_PARTNER",
      AND: [
        { participants: { some: { userId: userA, leftAt: null } } },
        { participants: { some: { userId: userB, leftAt: null } } },
      ],
    },
    include: { participants: { include: { user: { select: userSelect } } } },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function createOrGetNativeMarketplaceConversation(params: {
  creatorId: string;
  participantUserId: string;
  contextType?: ConversationContextType;
  contextId?: string | null;
  title?: string;
  commercialContext?: CommercialContext;
}) {
  const creator = await requireActiveChatUser(params.creatorId);
  const resolvedTargetId = await resolveMessagingUserId(params.participantUserId);
  if (!resolvedTargetId || resolvedTargetId === creator.id) {
    throw new ChatError("Participante inválido.", "VALIDATION", 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: resolvedTargetId },
    select: userSelect,
  });
  if (!target) throw new ChatError("Participante inválido.", "VALIDATION", 400);
  if (!canUseMessaging(target.accountStatus)) {
    throw new ChatError(`${target.name} não está com conta ativa.`, "ACCOUNT_NOT_ACTIVE", 403);
  }

  const type: ConversationType = resolveConversationTypeForRoles(creator.role, target.role, "CLIENT_PARTNER");
  const clientId = creator.role === "CLIENT" ? creator.id : target.role === "CLIENT" ? target.id : creator.id;
  const partnerId = creator.role === "PARTNER" ? creator.id : target.role === "PARTNER" ? target.id : target.id;

  const commercialContext: CommercialContext = {
    clientId,
    partnerId,
    petId: params.commercialContext?.petId ?? null,
    productId: params.commercialContext?.productId ?? (params.contextType === "PRODUCT" ? params.contextId : null),
    serviceId: params.commercialContext?.serviceId ?? (params.contextType === "SERVICE" ? params.contextId : null),
    description: params.commercialContext?.description ?? null,
    quantity: params.commercialContext?.quantity ?? null,
    deadline: params.commercialContext?.deadline ?? null,
    address: params.commercialContext?.address ?? null,
    attachments: params.commercialContext?.attachments ?? null,
  };

  const metadata = { commercialContext } as Prisma.InputJsonValue;

  if (type === "CLIENT_PARTNER") {
    const existing = await findExistingClientPartner(creator.id, target.id);
    if (existing) {
      const isParticipant = existing.participants.some((p) => p.userId === creator.id && !p.leftAt);
      if (!isParticipant) {
        throw new ChatError("Você não participa desta conversa.", "FORBIDDEN", 403);
      }
      const updated = await prisma.conversation.update({
        where: { id: existing.id },
        data: {
          contextType: params.contextType ?? existing.contextType ?? "GENERAL",
          contextId: params.contextId ?? existing.contextId,
          title: params.title ?? existing.title,
          metadata,
          status: "ACTIVE",
        },
        include: { participants: { include: { user: { select: userSelect } } } },
      });
      return { conversation: updated, created: false };
    }
  }

  const conversation = await createConversation({
    creatorId: creator.id,
    type,
    title: params.title,
    participantUserIds: [target.id],
    contextType: params.contextType ?? "GENERAL",
    contextId: params.contextId ?? null,
    metadata,
  });

  if (commercialContext.description) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: creator.id,
        content: commercialContext.description,
        type: "TEXT",
        metadata: { commercialContext } as Prisma.InputJsonValue,
      },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), status: "ACTIVE" },
    });
  }

  return { conversation, created: true };
}
