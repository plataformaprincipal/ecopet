import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const COMMERCIAL_EVENT = {
  QUOTE_SENT: "QUOTE_SENT",
  QUOTE_ACCEPTED: "QUOTE_ACCEPTED",
  QUOTE_REJECTED: "QUOTE_REJECTED",
  ADDED_TO_CART: "ADDED_TO_CART",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAID: "PAID",
  PARTNER_ACCEPTED: "PARTNER_ACCEPTED",
  PARTNER_REJECTED: "PARTNER_REJECTED",
  IN_PROGRESS: "IN_PROGRESS",
  READY: "READY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  CANCEL_REQUESTED: "CANCEL_REQUESTED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
  DISPUTED: "DISPUTED",
} as const;

export type CommercialEventType = (typeof COMMERCIAL_EVENT)[keyof typeof COMMERCIAL_EVENT];

export const COMMERCIAL_EVENT_LABELS: Record<CommercialEventType, string> = {
  QUOTE_SENT: "Orçamento enviado",
  QUOTE_ACCEPTED: "Orçamento aceito",
  QUOTE_REJECTED: "Orçamento recusado",
  ADDED_TO_CART: "Adicionado ao carrinho",
  PAYMENT_PENDING: "Pagamento pendente",
  PAID: "Pagamento aprovado",
  PARTNER_ACCEPTED: "Parceiro aceitou",
  PARTNER_REJECTED: "Parceiro recusou",
  IN_PROGRESS: "Em andamento",
  READY: "Pronto",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  CANCEL_REQUESTED: "Cancelamento solicitado",
  REFUND_PENDING: "Reembolso em processamento",
  REFUNDED: "Reembolso concluído",
  DISPUTED: "Disputa registrada",
};

export function labelForOrderStatus(status: string): CommercialEventType | null {
  switch (status) {
    case "PAID":
      return COMMERCIAL_EVENT.PAID;
    case "CONFIRMED":
      return COMMERCIAL_EVENT.PARTNER_ACCEPTED;
    case "PREPARING":
    case "PROCESSING":
      return COMMERCIAL_EVENT.IN_PROGRESS;
    case "READY_FOR_PICKUP":
    case "READY_PICKUP":
      return COMMERCIAL_EVENT.READY;
    case "COMPLETED":
    case "DELIVERED":
    case "PICKED_UP":
      return COMMERCIAL_EVENT.COMPLETED;
    case "CANCELLED":
      return COMMERCIAL_EVENT.CANCELLED;
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return COMMERCIAL_EVENT.REFUNDED;
    default:
      return null;
  }
}

export async function postCommercialEvent(params: {
  conversationId: string;
  senderId: string;
  event: CommercialEventType;
  quoteId?: string | null;
  orderId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const content = COMMERCIAL_EVENT_LABELS[params.event];
  const metadata: Prisma.InputJsonValue = {
    commercial: true,
    immutable: true,
    event: params.event,
    quoteId: params.quoteId ?? null,
    orderId: params.orderId ?? null,
    ...(params.payload ?? {}),
  };

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: params.conversationId,
        senderId: params.senderId,
        content,
        type: "SYSTEM",
        metadata,
      },
    });
    await tx.conversation.update({
      where: { id: params.conversationId },
      data: { lastMessageAt: new Date(), updatedAt: new Date(), status: "ACTIVE" },
    });
    return created;
  });

  return message;
}

export async function postOrderCommercialEvent(params: {
  orderId: string;
  event: CommercialEventType;
  actorId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const quotes = await prisma.customQuote.findMany({
    where: { status: { in: ["CONVERTED", "COMPLETED", "ACCEPTED"] } },
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: { id: true, conversationId: true, requesterId: true, providerId: true, includedItems: true },
  });
  const quote = quotes.find((q) => {
    const extras = q.includedItems && typeof q.includedItems === "object" && !Array.isArray(q.includedItems)
      ? (q.includedItems as Record<string, unknown>)
      : {};
    return extras.orderId === params.orderId;
  });
  if (!quote?.conversationId) return null;
  const senderId = params.actorId || quote.providerId || quote.requesterId;
  return postCommercialEvent({
    conversationId: quote.conversationId,
    senderId,
    event: params.event,
    quoteId: quote.id,
    orderId: params.orderId,
    payload: params.payload,
  });
}
