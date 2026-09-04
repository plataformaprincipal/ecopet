import "server-only";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ChatError } from "@/lib/messages/utils";
import { executePaymentRefund } from "@/lib/mercado-pago/refunds";
import { postLedgerForRefund } from "@/lib/finance/refund-ledger";
import { refundPolicyForSku } from "@/lib/commerce-catalog/refund-policy";
import { COMMERCIAL_EVENT, postOrderCommercialEvent } from "@/lib/commerce-chat/events";
import { cancelQuote, findQuoteByOrderId } from "@/lib/commerce-chat/quotes";

function approvedPayments<T extends { status: string }>(payments: T[]) {
  return payments.filter((p) => p.status === "APPROVED" || p.status === "PARTIALLY_REFUNDED");
}

export async function partnerRejectOrder(params: { orderId: string; partnerId: string; reason?: string }) {
  const order = await prisma.order.findFirst({
    where: { id: params.orderId, partnerId: params.partnerId },
    include: { payments: true, items: true },
  });
  if (!order) throw new ChatError("Pedido não encontrado.", "NOT_FOUND", 404);

  const paid = approvedPayments(order.payments);
  const reason = (params.reason ?? "Pedido recusado pelo parceiro").slice(0, 500);

  if (!paid.length) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        fulfillmentStatus: OrderStatus.CANCELLED,
        statusHistory: { create: { status: OrderStatus.CANCELLED, note: reason } },
      },
    });
    const quote = await findQuoteByOrderId(order.id);
    if (quote) await cancelQuote(quote.id, params.partnerId).catch(() => undefined);
    await postOrderCommercialEvent({
      orderId: order.id,
      event: COMMERCIAL_EVENT.PARTNER_REJECTED,
      actorId: params.partnerId,
      payload: { reason },
    });
    await postOrderCommercialEvent({
      orderId: order.id,
      event: COMMERCIAL_EVENT.CANCELLED,
      actorId: params.partnerId,
    });
    return { mode: "cancelled" as const, orderId: order.id };
  }

  await postOrderCommercialEvent({
    orderId: order.id,
    event: COMMERCIAL_EVENT.PARTNER_REJECTED,
    actorId: params.partnerId,
    payload: { reason },
  });
  await postOrderCommercialEvent({
    orderId: order.id,
    event: COMMERCIAL_EVENT.REFUND_PENDING,
    actorId: params.partnerId,
  });

  const payment = paid[0]!;
  if (payment.provider === "mercado_pago" && payment.providerPaymentId) {
    const result = await executePaymentRefund({
      paymentId: payment.id,
      adminId: params.partnerId,
      full: true,
      reason,
      internalReason: "partner_reject_after_payment",
    });
    if (result.ok) {
      await postOrderCommercialEvent({
        orderId: order.id,
        event: COMMERCIAL_EVENT.REFUNDED,
        actorId: params.partnerId,
        payload: { paymentRefundId: result.paymentRefundId, amount: result.refundedAmount },
      });
    }
    return { mode: "mp_refund" as const, result };
  }

  const local = await localRefundNonGatewayPayment({
    paymentId: payment.id,
    orderId: order.id,
    actorId: params.partnerId,
    amount: payment.amount - (payment.refundedAmount || 0),
    reason,
  });
  await postOrderCommercialEvent({
    orderId: order.id,
    event: COMMERCIAL_EVENT.REFUNDED,
    actorId: params.partnerId,
    payload: { local: true },
  });
  return { mode: "local_refund" as const, result: local };
}

async function localRefundNonGatewayPayment(params: {
  paymentId: string;
  orderId: string;
  actorId: string;
  amount: number;
  reason: string;
}) {
  const payment = await prisma.payment.findUnique({ where: { id: params.paymentId } });
  if (!payment) throw new ChatError("Pagamento não encontrado.", "NOT_FOUND", 404);

  const refund = await prisma.paymentRefund.create({
    data: {
      paymentId: payment.id,
      orderId: params.orderId,
      buyerUserId: payment.userId,
      type: "FULL",
      amount: params.amount,
      reason: params.reason,
      requestedById: params.actorId,
      status: "PROCESSED",
      processedAt: new Date(),
      approvedById: params.actorId,
      stockReturnStatus: "NOT_REQUIRED",
      idempotencyKey: `local_refund_${payment.id}_${Date.now()}`.slice(0, 64),
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "REFUNDED",
      refundedAmount: params.amount,
    },
  });
  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      status: OrderStatus.REFUNDED,
      fulfillmentStatus: OrderStatus.REFUNDED,
      statusHistory: { create: { status: OrderStatus.REFUNDED, note: params.reason } },
    },
  });

  await postLedgerForRefund({
    paymentId: payment.id,
    refundAmount: params.amount,
    paymentRefundId: refund.id,
    fullRefund: true,
  }).catch(() => undefined);

  return { paymentRefundId: refund.id };
}

export function refundRuleForOrderItems(items: Array<{ sku?: string | null }>) {
  const sku = items.find((i) => i.sku)?.sku ?? "MKT-CUSTOM";
  return refundPolicyForSku(sku);
}
