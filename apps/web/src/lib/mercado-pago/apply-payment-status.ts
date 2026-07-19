import "server-only";

import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createInternalNotification } from "@/lib/notifications/internal";
import { emailOrderEvent } from "@/lib/mail/event-dispatch";
import { getUserEmailLocale } from "@/lib/email/templates";
import { writeAuditLog } from "@/lib/audit-log";
import {
  isRefundedStatus,
  isTerminalApproved,
  isTerminalFailure,
  type InternalPaymentStatus,
} from "@/lib/mercado-pago/status";

type PaymentMeta = {
  stockReleased?: boolean;
  platformFeeEstimated?: number | null;
  partnerNetEstimated?: number | null;
  splitReady?: boolean;
  [key: string]: unknown;
};

async function restoreStockForOrder(orderId: string, actorId: string | null) {
  const items = await prisma.orderItem.findMany({
    where: { orderId, productId: { not: null } },
    select: { productId: true, quantity: true, partnerId: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (!item.productId) continue;
      const updated = await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          partnerId: item.partnerId ?? updated.sellerId,
          delta: item.quantity,
          stockAfter: updated.stock,
          reason: "PAYMENT_RELEASE",
          actorId: actorId ?? undefined,
        },
      });
    }
  });
}

/**
 * Aplica status interno de pagamento ao Payment + Order de forma idempotente.
 * E-mail/notificação falhando não reverte a atualização financeira.
 */
export async function applyInternalPaymentStatus(params: {
  paymentId: string;
  internalStatus: InternalPaymentStatus;
  statusDetail?: string | null;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  source: "api" | "webhook" | "poll";
}): Promise<{ changed: boolean }> {
  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    include: {
      order: {
        select: {
          id: true,
          userId: true,
          partnerId: true,
          orderNumber: true,
          status: true,
          total: true,
        },
      },
    },
  });
  if (!payment) return { changed: false };

  if (payment.status === params.internalStatus) {
    return { changed: false };
  }

  // Não rebaixar APPROVED sem estorno
  if (
    payment.status === "APPROVED" &&
    !isRefundedStatus(params.internalStatus) &&
    params.internalStatus !== "APPROVED"
  ) {
    return { changed: false };
  }

  const now = new Date();
  const data: Prisma.PaymentUpdateInput = {
    status: params.internalStatus,
    statusDetail: params.statusDetail ?? payment.statusDetail,
    ...(params.providerOrderId
      ? { providerOrderId: params.providerOrderId, externalId: params.providerOrderId }
      : {}),
    ...(params.providerPaymentId ? { providerPaymentId: params.providerPaymentId } : {}),
  };

  if (isTerminalApproved(params.internalStatus)) data.approvedAt = now;
  if (params.internalStatus === "CANCELLED" || params.internalStatus === "EXPIRED") {
    data.cancelledAt = now;
  }
  if (isRefundedStatus(params.internalStatus)) data.refundedAt = now;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data });
    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        provider: "mercado_pago",
        eventType: `status:${params.source}`,
        status: params.internalStatus,
        message: params.statusDetail?.slice(0, 280) ?? null,
      },
    });

    if (isTerminalApproved(params.internalStatus) && payment.order.status !== OrderStatus.PAID) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAID },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.PAID,
          note: `Pagamento aprovado via Mercado Pago (${params.source})`,
        },
      });
    }

    if (
      isRefundedStatus(params.internalStatus) &&
      (payment.order.status === OrderStatus.PAID ||
        payment.order.status === OrderStatus.PARTIALLY_REFUNDED)
    ) {
      const orderStatus =
        params.internalStatus === "PARTIALLY_REFUNDED"
          ? OrderStatus.PARTIALLY_REFUNDED
          : OrderStatus.REFUNDED;
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: orderStatus },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: orderStatus,
          note: `Pagamento ${params.internalStatus} (${params.source})`,
        },
      });
    }

    if (
      isTerminalFailure(params.internalStatus) &&
      payment.order.status !== OrderStatus.PAID &&
      payment.order.status !== OrderStatus.CANCELLED
    ) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.CANCELLED,
          note: `Pagamento ${params.internalStatus} — pedido cancelado (${params.source})`,
        },
      });
    }
  });

  const meta = (payment.metadata as PaymentMeta | null) ?? {};
  // Estoque: liberar em falha/cancelamento/expiração.
  // Estorno total/parcial NÃO devolve estoque automaticamente (exige devolução física/admin).
  const shouldReleaseStock =
    !meta.stockReleased &&
    isTerminalFailure(params.internalStatus) &&
    params.internalStatus !== "REFUNDED" &&
    params.internalStatus !== "PARTIALLY_REFUNDED" &&
    params.internalStatus !== "CHARGED_BACK";

  if (shouldReleaseStock) {
    try {
      await restoreStockForOrder(payment.orderId, payment.userId);
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          metadata: { ...meta, stockReleased: true } as Prisma.InputJsonValue,
        },
      });
    } catch {
      /* estoque: log via audit abaixo */
    }
  }

  // Chargeback: bloqueia fulfillment; estoque fica para análise
  if (params.internalStatus === "CHARGED_BACK") {
    try {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { fulfillmentBlocked: true, fraudHold: true },
      });
    } catch {
      /* ignore */
    }
  }

  void writeAuditLog({
    actorId: payment.userId ?? undefined,
    action: "UPDATE",
    module: "payments.mercado_pago",
    resource: "Payment",
    resourceId: payment.id,
    observation: `${params.internalStatus} via ${params.source}`,
  }).catch(() => undefined);

  // Notificações / e-mail — não bloqueiam
  try {
    if (isTerminalApproved(params.internalStatus)) {
      await createInternalNotification({
        userId: payment.order.userId,
        title: "Pagamento aprovado",
        body: `Pagamento do pedido #${payment.order.orderNumber} confirmado.`,
        type: "PAYMENT_APPROVED",
        actionUrl: `/dashboard/client/orders/${payment.order.id}`,
        data: { orderId: payment.order.id, paymentId: payment.id },
      });
      if (payment.order.partnerId) {
        await createInternalNotification({
          userId: payment.order.partnerId,
          title: "Pedido pago",
          body: `Pedido #${payment.order.orderNumber} foi pago.`,
          type: "ORDER_PAID",
          actionUrl: `/dashboard/partner/orders/${payment.order.id}`,
          data: { orderId: payment.order.id },
        });
      }
      const user = await prisma.user.findUnique({
        where: { id: payment.order.userId },
        select: { email: true, name: true, preferences: true },
      });
      if (user?.email) {
        void emailOrderEvent("ORDER_CONFIRMED", user.email, payment.order.orderNumber, {
          name: user.name,
          locale: getUserEmailLocale(user.preferences),
        });
      }
    }
  } catch {
    /* ignore */
  }

  return { changed: true };
}
