/**
 * Factories contextuais com ownership — não confiar em IDs do cliente sem validar.
 */
import "server-only";

import type { ConversationContextType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ChatError } from "@/lib/messages/utils";
import { createOrGetTalkJsConversation } from "@/lib/messages/talkjs-conversations";
import { isMessagingFlagEnabled } from "./config";

export async function openProductConversation(input: {
  creatorId: string;
  productId: string;
}) {
  if (!isMessagingFlagEnabled("marketplace_chat")) {
    throw new ChatError("Chat do Marketplace desativado.", "FLAG_DISABLED", 503);
  }
  const product = await prisma.product.findFirst({
    where: { id: input.productId, deletedAt: null },
    select: { id: true, name: true, sellerId: true, approvalStatus: true },
  });
  if (!product || product.approvalStatus !== "APPROVED") {
    throw new ChatError("Produto não disponível.", "NOT_FOUND", 404);
  }
  return createOrGetTalkJsConversation({
    creatorId: input.creatorId,
    participantUserId: product.sellerId,
    contextType: "PRODUCT",
    contextId: product.id,
    title: `Produto: ${product.name}`,
  });
}

export async function openServiceConversation(input: {
  creatorId: string;
  serviceId: string;
}) {
  if (!isMessagingFlagEnabled("marketplace_chat")) {
    throw new ChatError("Chat do Marketplace desativado.", "FLAG_DISABLED", 503);
  }
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, deletedAt: null },
    select: { id: true, name: true, providerId: true, approvalStatus: true },
  });
  if (!service || service.approvalStatus !== "APPROVED") {
    throw new ChatError("Serviço não disponível.", "NOT_FOUND", 404);
  }
  return createOrGetTalkJsConversation({
    creatorId: input.creatorId,
    participantUserId: service.providerId,
    contextType: "SERVICE",
    contextId: service.id,
    title: `Serviço: ${service.name}`,
  });
}

export async function openOrderConversation(input: {
  creatorId: string;
  orderId: string;
}) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId },
    select: { id: true, orderNumber: true, userId: true, partnerId: true },
  });
  if (!order) throw new ChatError("Pedido não encontrado.", "NOT_FOUND", 404);
  if (!order.partnerId) {
    throw new ChatError("Pedido sem parceiro associado.", "VALIDATION", 400);
  }

  const isBuyer = order.userId === input.creatorId;
  const isPartner = order.partnerId === input.creatorId;
  if (!isBuyer && !isPartner) {
    throw new ChatError("Sem permissão para conversar sobre este pedido.", "FORBIDDEN", 403);
  }

  const otherId = isBuyer ? order.partnerId : order.userId;
  return createOrGetTalkJsConversation({
    creatorId: input.creatorId,
    participantUserId: otherId,
    contextType: "ORDER",
    contextId: order.id,
    title: `Pedido #${order.orderNumber}`,
  });
}

export async function openAdoptionConversation(input: {
  creatorId: string;
  animalOrPostOwnerId: string;
  contextId: string;
}) {
  if (!isMessagingFlagEnabled("adoption_chat") && !isMessagingFlagEnabled("ngo_chat")) {
    throw new ChatError("Chat de adoção desativado.", "FLAG_DISABLED", 503);
  }
  return createOrGetTalkJsConversation({
    creatorId: input.creatorId,
    participantUserId: input.animalOrPostOwnerId,
    contextType: "ADOPTION",
    contextId: input.contextId,
    title: "Adoção",
  });
}

export async function openSupportConversation(input: {
  creatorId: string;
  adminUserId?: string;
  subject?: string;
}) {
  if (!isMessagingFlagEnabled("support_chat")) {
    throw new ChatError("Chat de suporte desativado.", "FLAG_DISABLED", 503);
  }

  let adminId = input.adminUserId;
  if (!adminId) {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", accountStatus: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    adminId = admin?.id;
  }
  if (!adminId) {
    throw new ChatError("Nenhum atendente disponível.", "UNAVAILABLE", 503);
  }

  return createOrGetTalkJsConversation({
    creatorId: input.creatorId,
    participantUserId: adminId,
    contextType: "SUPPORT",
    contextId: `support_${input.creatorId}`,
    title: input.subject ?? "Suporte EcoPet",
  });
}

export async function openContextualConversation(input: {
  creatorId: string;
  contextType: ConversationContextType;
  contextId: string;
  participantUserId?: string;
  title?: string;
}) {
  switch (input.contextType) {
    case "PRODUCT":
      return openProductConversation({ creatorId: input.creatorId, productId: input.contextId });
    case "SERVICE":
      return openServiceConversation({ creatorId: input.creatorId, serviceId: input.contextId });
    case "ORDER":
      return openOrderConversation({ creatorId: input.creatorId, orderId: input.contextId });
    case "SUPPORT":
      return openSupportConversation({
        creatorId: input.creatorId,
        adminUserId: input.participantUserId,
        subject: input.title,
      });
    case "ADOPTION":
      if (!input.participantUserId) {
        throw new ChatError("Participante da adoção obrigatório.", "VALIDATION", 400);
      }
      return openAdoptionConversation({
        creatorId: input.creatorId,
        animalOrPostOwnerId: input.participantUserId,
        contextId: input.contextId,
      });
    default:
      if (!input.participantUserId) {
        throw new ChatError("participantUserId obrigatório.", "VALIDATION", 400);
      }
      return createOrGetTalkJsConversation({
        creatorId: input.creatorId,
        participantUserId: input.participantUserId,
        contextType: input.contextType,
        contextId: input.contextId,
        title: input.title,
      });
  }
}
