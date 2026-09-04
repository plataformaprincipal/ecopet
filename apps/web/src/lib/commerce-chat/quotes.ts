import "server-only";

import { Prisma, QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ChatError } from "@/lib/messages/utils";
import { assertConversationParticipant, assertConversationParticipantOrAdmin } from "@/lib/messages/permissions";
import { serverQuoteProduct, PricingError } from "@/lib/pricing/service";
import { getOrCreateCart, addQuoteToCart } from "@/lib/cart/cart-service";
import {
  assembleQuoteFinancials,
  linesAfterDiscount,
  validateQuoteLines,
  type QuoteLineInput,
} from "@/lib/commerce-chat/quotes-math";
import { COMMERCIAL_EVENT, postCommercialEvent } from "@/lib/commerce-chat/events";

export type QuotePayload = {
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    sku?: string | null;
    productId?: string | null;
    serviceId?: string | null;
  }>;
  discountAmount: number;
  shippingAmount: number;
  subtotalAmount: number;
  commissionAmount: number;
  taxAmount: number;
  totalAmount: number;
  pricingVersion: string | null;
  pricingSnapshot: unknown;
  notes: string | null;
  rejectionReason: string | null;
  petId: string | null;
  productId: string | null;
  serviceId: string | null;
  orderId: string | null;
  cancelled?: boolean;
};

function asPayload(json: Prisma.JsonValue | null | undefined): QuotePayload {
  const row = (json && typeof json === "object" && !Array.isArray(json) ? json : {}) as Record<string, unknown>;
  const items = Array.isArray(row.items) ? (row.items as QuotePayload["items"]) : [];
  return {
    items,
    discountAmount: Number(row.discountAmount ?? 0),
    shippingAmount: Number(row.shippingAmount ?? 0),
    subtotalAmount: Number(row.subtotalAmount ?? 0),
    commissionAmount: Number(row.commissionAmount ?? 0),
    taxAmount: Number(row.taxAmount ?? 0),
    totalAmount: Number(row.totalAmount ?? 0),
    pricingVersion: typeof row.pricingVersion === "string" ? row.pricingVersion : null,
    pricingSnapshot: row.pricingSnapshot ?? null,
    notes: typeof row.notes === "string" ? row.notes : null,
    rejectionReason: typeof row.rejectionReason === "string" ? row.rejectionReason : null,
    petId: typeof row.petId === "string" ? row.petId : null,
    productId: typeof row.productId === "string" ? row.productId : null,
    serviceId: typeof row.serviceId === "string" ? row.serviceId : null,
    orderId: typeof row.orderId === "string" ? row.orderId : null,
    cancelled: row.cancelled === true,
  };
}

export function serializeQuote(quote: {
  id: string;
  conversationId: string | null;
  requesterId: string;
  providerId: string;
  name: string;
  description: string;
  value: number;
  validUntil: Date;
  executionDays: number | null;
  status: QuoteStatus;
  conditions: string | null;
  includedItems: Prisma.JsonValue | null;
}) {
  const payload = asPayload(quote.includedItems);
  const status =
    payload.cancelled && quote.status !== QuoteStatus.CONVERTED
      ? "CANCELLED"
      : quote.status === QuoteStatus.CONVERTED
        ? "CONVERTED_TO_ORDER"
        : quote.status;
  return {
    id: quote.id,
    conversationId: quote.conversationId,
    requesterId: quote.requesterId,
    providerId: quote.providerId,
    name: quote.name,
    description: quote.description,
    status,
    validUntil: quote.validUntil.toISOString(),
    executionDays: quote.executionDays,
    conditions: quote.conditions,
    notes: payload.notes,
    rejectionReason: payload.rejectionReason,
    petId: payload.petId,
    productId: payload.productId,
    serviceId: payload.serviceId,
    orderId: payload.orderId,
    subtotalAmount: payload.subtotalAmount,
    discountAmount: payload.discountAmount,
    shippingAmount: payload.shippingAmount,
    commissionAmount: payload.commissionAmount,
    taxAmount: payload.taxAmount,
    totalAmount: payload.totalAmount || quote.value,
    pricingVersion: payload.pricingVersion,
    items: payload.items.map((item, idx) => ({
      id: item.id ?? `${quote.id}-${idx}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sku: item.sku ?? null,
      productId: item.productId ?? null,
      serviceId: item.serviceId ?? null,
    })),
  };
}

async function computeServerTotals(params: {
  items: QuoteLineInput[];
  discountAmount?: number;
  shippingAmount?: number;
  claimedTotal?: number;
  partnerId: string;
}) {
  const items = validateQuoteLines(params.items);
  const discounted = linesAfterDiscount(items, params.discountAmount ?? 0);
  let engine;
  try {
    const quoted = await serverQuoteProduct({
      lines: discounted.map((line) => ({
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        sku: line.sku ?? null,
      })),
      partnerVerified: true,
      partnerId: params.partnerId,
      charging: true,
    });
    engine = quoted.order;
  } catch (e) {
    if (e instanceof PricingError) throw e;
    throw new ChatError("Não foi possível calcular o orçamento.", "PRICING_UNAVAILABLE", 503);
  }
  return assembleQuoteFinancials({
    items,
    discountAmount: params.discountAmount,
    shippingAmount: params.shippingAmount,
    claimedTotal: params.claimedTotal,
    engine,
  });
}

async function assertQuoteParticipant(quoteId: string, userId: string) {
  const quote = await prisma.customQuote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new ChatError("Orçamento não encontrado.", "NOT_FOUND", 404);
  if (quote.conversationId) {
    await assertConversationParticipant(quote.conversationId, userId);
  } else if (quote.requesterId !== userId && quote.providerId !== userId) {
    throw new ChatError("Você não participa desta conversa.", "FORBIDDEN", 403);
  }
  return quote;
}

function mergePayload(quote: { includedItems: Prisma.JsonValue | null }, patch: Partial<QuotePayload>): Prisma.InputJsonValue {
  return { ...asPayload(quote.includedItems), ...patch } as Prisma.InputJsonValue;
}

export async function createAndSendQuote(params: {
  conversationId: string;
  actorId: string;
  name?: string;
  description?: string;
  items: QuoteLineInput[];
  discountAmount?: number;
  shippingAmount?: number;
  claimedTotal?: number;
  validUntil: Date;
  executionDays?: number | null;
  notes?: string | null;
  conditions?: string | null;
  petId?: string | null;
  productId?: string | null;
  serviceId?: string | null;
}) {
  await assertConversationParticipant(params.conversationId, params.actorId);
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    include: { participants: { include: { user: { select: { id: true, role: true } } } } },
  });
  if (!conversation) throw new ChatError("Conversa não encontrada.", "NOT_FOUND", 404);

  const actor = conversation.participants.find((p) => p.userId === params.actorId);
  if (actor?.user.role !== "PARTNER") {
    throw new ChatError("Somente o parceiro pode criar orçamento.", "FORBIDDEN", 403);
  }

  const client = conversation.participants.find((p) => p.user.role === "CLIENT");
  if (!client) throw new ChatError("Conversa sem cliente.", "VALIDATION", 400);

  const now = new Date();
  const expiredOnCreate = params.validUntil.getTime() <= now.getTime();
  const financials = await computeServerTotals({
    items: params.items,
    discountAmount: params.discountAmount,
    shippingAmount: params.shippingAmount,
    claimedTotal: params.claimedTotal,
    partnerId: params.actorId,
  });

  const payload: QuotePayload = {
    items: financials.items,
    discountAmount: financials.discountAmount,
    shippingAmount: financials.shippingAmount,
    subtotalAmount: financials.subtotalAmount,
    commissionAmount: financials.commissionAmount,
    taxAmount: financials.taxAmount,
    totalAmount: financials.totalAmount,
    pricingVersion: financials.pricingVersion,
    pricingSnapshot: financials.pricingSnapshot,
    notes: params.notes ?? null,
    rejectionReason: null,
    petId: params.petId ?? null,
    productId: params.productId ?? null,
    serviceId: params.serviceId ?? null,
    orderId: null,
  };

  const quote = await prisma.customQuote.create({
    data: {
      conversationId: params.conversationId,
      requesterId: client.userId,
      providerId: params.actorId,
      name: (params.name ?? "Orçamento personalizado").slice(0, 120),
      description: (params.description ?? financials.items.map((i) => i.description).join(", ")).slice(0, 2000),
      value: financials.totalAmount,
      validUntil: params.validUntil,
      executionDays: params.executionDays ?? null,
      status: expiredOnCreate ? QuoteStatus.EXPIRED : QuoteStatus.SENT,
      conditions: params.conditions ?? null,
      includedItems: payload as object,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      senderId: params.actorId,
      content: `Orçamento: ${quote.name}`,
      type: "QUOTE",
      metadata: {
        commercial: true,
        immutable: true,
        quoteId: quote.id,
        event: COMMERCIAL_EVENT.QUOTE_SENT,
      },
    },
  });
  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: now, updatedAt: now, status: "ACTIVE" },
  });

  return serializeQuote(quote);
}

export async function getConversationQuotes(conversationId: string, userId: string) {
  await assertConversationParticipantOrAdmin(conversationId, userId);
  const quotes = await prisma.customQuote.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });
  return quotes.map(serializeQuote);
}

export async function getQuoteForUser(quoteId: string, userId: string) {
  const quote = await assertQuoteParticipant(quoteId, userId);
  return serializeQuote(quote);
}

export async function rejectQuote(params: { quoteId: string; actorId: string; reason?: string | null }) {
  const quote = await assertQuoteParticipant(params.quoteId, params.actorId);
  if (quote.requesterId !== params.actorId) {
    throw new ChatError("Somente o cliente pode recusar o orçamento.", "FORBIDDEN", 403);
  }
  if (quote.status !== QuoteStatus.SENT && quote.status !== QuoteStatus.VIEWED && quote.status !== QuoteStatus.NEGOTIATING) {
    throw new ChatError("Este orçamento não pode ser recusado.", "VALIDATION", 400);
  }

  const updated = await prisma.customQuote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.REJECTED,
      includedItems: mergePayload(quote, { rejectionReason: params.reason?.slice(0, 500) ?? null }),
    },
  });

  if (quote.conversationId) {
    await postCommercialEvent({
      conversationId: quote.conversationId,
      senderId: params.actorId,
      event: COMMERCIAL_EVENT.QUOTE_REJECTED,
      quoteId: quote.id,
      payload: { reason: params.reason ?? null },
    });
  }

  return serializeQuote(updated);
}

export async function acceptQuote(params: { quoteId: string; actorId: string; claimedTotal?: number }) {
  const quote = await assertQuoteParticipant(params.quoteId, params.actorId);
  if (quote.requesterId !== params.actorId) {
    throw new ChatError("Somente o cliente pode aceitar o orçamento.", "FORBIDDEN", 403);
  }
  if (quote.status === QuoteStatus.EXPIRED || quote.validUntil.getTime() <= Date.now()) {
    if (quote.status !== QuoteStatus.EXPIRED) {
      await prisma.customQuote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.EXPIRED },
      });
    }
    throw new ChatError("Orçamento expirado.", "QUOTE_EXPIRED", 409);
  }
  if (quote.status !== QuoteStatus.SENT && quote.status !== QuoteStatus.VIEWED && quote.status !== QuoteStatus.NEGOTIATING) {
    throw new ChatError("Este orçamento não pode ser aceito.", "VALIDATION", 400);
  }

  const current = asPayload(quote.includedItems);
  const financials = await computeServerTotals({
    items: current.items.length ? current.items : [{ description: quote.name, quantity: 1, unitPrice: quote.value }],
    discountAmount: current.discountAmount,
    shippingAmount: current.shippingAmount,
    claimedTotal: params.claimedTotal,
    partnerId: quote.providerId,
  });

  const updated = await prisma.customQuote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.ACCEPTED,
      value: financials.totalAmount,
      includedItems: mergePayload(quote, {
        items: financials.items,
        discountAmount: financials.discountAmount,
        shippingAmount: financials.shippingAmount,
        subtotalAmount: financials.subtotalAmount,
        commissionAmount: financials.commissionAmount,
        taxAmount: financials.taxAmount,
        totalAmount: financials.totalAmount,
        pricingVersion: financials.pricingVersion,
        pricingSnapshot: financials.pricingSnapshot,
      }),
    },
  });

  const cart = await getOrCreateCart(params.actorId);
  await addQuoteToCart(cart, updated.id);

  if (quote.conversationId) {
    await postCommercialEvent({
      conversationId: quote.conversationId,
      senderId: params.actorId,
      event: COMMERCIAL_EVENT.QUOTE_ACCEPTED,
      quoteId: quote.id,
      payload: { totalAmount: financials.totalAmount },
    });
    await postCommercialEvent({
      conversationId: quote.conversationId,
      senderId: params.actorId,
      event: COMMERCIAL_EVENT.ADDED_TO_CART,
      quoteId: quote.id,
    });
  }

  return { quote: serializeQuote(updated), checkoutHref: "/checkout" };
}

export async function markQuoteConverted(quoteId: string, orderId: string) {
  const quote = await prisma.customQuote.findUnique({ where: { id: quoteId } });
  if (!quote) return null;
  return prisma.customQuote.update({
    where: { id: quoteId },
    data: {
      status: QuoteStatus.CONVERTED,
      includedItems: mergePayload(quote, { orderId }),
    },
  });
}

export async function cancelQuote(quoteId: string, actorId: string) {
  const quote = await assertQuoteParticipant(quoteId, actorId);
  if (quote.status === QuoteStatus.CONVERTED || quote.status === QuoteStatus.COMPLETED) {
    throw new ChatError("Orçamento já convertido.", "VALIDATION", 400);
  }
  return prisma.customQuote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.REJECTED,
      includedItems: mergePayload(quote, { cancelled: true }),
    },
  });
}

export async function findQuoteByOrderId(orderId: string) {
  const quotes = await prisma.customQuote.findMany({
    where: { status: { in: [QuoteStatus.CONVERTED, QuoteStatus.COMPLETED, QuoteStatus.ACCEPTED] } },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return quotes.find((q) => asPayload(q.includedItems).orderId === orderId) ?? null;
}

export { asPayload };
