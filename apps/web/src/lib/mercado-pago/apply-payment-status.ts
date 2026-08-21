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
import {
  assertSimulatedPaymentAllowed,
  isAuthorizedPaidSource,
} from "@/lib/payments/simulated-payments";
import { postLedgerForApprovedPayment } from "@/lib/finance/ledger";
import { getFinancialFlags } from "@/lib/finance/flags";

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
  /** External event id for audit (webhook/provider) — never a secret */
  eventId?: string | null;
  /** Valor informado pelo gateway (comparado ao Payment.amount) */
  receivedAmount?: number | null;
}): Promise<{ changed: boolean }> {
  const simCheck = assertSimulatedPaymentAllowed(
    params.providerPaymentId ?? params.providerOrderId
  );
  if (!simCheck.ok && isTerminalApproved(params.internalStatus)) {
    await writeAuditLog({
      action: "UPDATE",
      module: "payments",
      resource: "Payment",
      resourceId: params.paymentId,
      observation: `${simCheck.code}: tentativa de PAID com identificador simulado bloqueada`,
      entityAfter: {
        source: params.source,
        eventId: params.eventId ?? null,
        blocked: true,
      },
    }).catch(() => undefined);
    return { changed: false };
  }

  if (
    isTerminalApproved(params.internalStatus) &&
    !isAuthorizedPaidSource(params.source)
  ) {
    await writeAuditLog({
      action: "UPDATE",
      module: "payments",
      resource: "Payment",
      resourceId: params.paymentId,
      observation: "Transição para APPROVED/PAID rejeitada: origem não autorizada",
      entityAfter: { source: params.source, eventId: params.eventId ?? null },
    }).catch(() => undefined);
    return { changed: false };
  }

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
          financialLedgerPostedAt: true,
        },
      },
    },
  });
  if (!payment) return { changed: false };

  // Identificador externo já vinculado a outro pedido
  if (params.providerPaymentId || params.providerOrderId) {
    const conflict = await prisma.payment.findFirst({
      where: {
        id: { not: payment.id },
        OR: [
          ...(params.providerPaymentId
            ? [{ providerPaymentId: params.providerPaymentId }]
            : []),
          ...(params.providerOrderId
            ? [{ providerOrderId: params.providerOrderId }, { externalId: params.providerOrderId }]
            : []),
        ],
      },
      select: { id: true, orderId: true },
    });
    if (conflict && conflict.orderId !== payment.orderId) {
      await writeAuditLog({
        action: "UPDATE",
        module: "payments",
        resource: "Payment",
        resourceId: payment.id,
        observation: "Identificador externo já vinculado a outro pedido",
        entityAfter: {
          conflictPaymentId: conflict.id,
          conflictOrderId: conflict.orderId,
          source: params.source,
        },
      }).catch(() => undefined);
      return { changed: false };
    }
  }

  if (
    isTerminalApproved(params.internalStatus) &&
    typeof params.receivedAmount === "number" &&
    Number.isFinite(params.receivedAmount)
  ) {
    const expected = Number(payment.amount);
    const diff = Math.abs(params.receivedAmount - expected);
    if (diff > 0.01) {
      await writeAuditLog({
        action: "UPDATE",
        module: "payments",
        resource: "Payment",
        resourceId: payment.id,
        observation: "Valor divergente entre gateway e Payment.amount",
        entityAfter: {
          expected,
          received: params.receivedAmount,
          source: params.source,
          eventId: params.eventId ?? null,
        },
      }).catch(() => undefined);
      return { changed: false };
    }
  }

  // Não confirmar PAID em pagamento já cancelado
  if (
    isTerminalApproved(params.internalStatus) &&
    (payment.status === "CANCELLED" || payment.status === "EXPIRED" || payment.order.status === OrderStatus.CANCELLED)
  ) {
    await writeAuditLog({
      action: "UPDATE",
      module: "payments",
      resource: "Payment",
      resourceId: payment.id,
      observation: "PAID rejeitado: pagamento/pedido já cancelado",
      entityAfter: { source: params.source, paymentStatus: payment.status, orderStatus: payment.order.status },
    }).catch(() => undefined);
    return { changed: false };
  }

  if (payment.status === params.internalStatus) {
    // Recuperação: PAID sem ledger (falha anterior / retry)
    if (
      isTerminalApproved(params.internalStatus) &&
      getFinancialFlags().FINANCIAL_LEDGER_ENABLED &&
      !payment.order.financialLedgerPostedAt
    ) {
      await postLedgerForApprovedPayment({
        paymentId: payment.id,
        source: `${params.source}:recovery`,
      });
    }
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
        message: [
          params.statusDetail?.slice(0, 200) ?? null,
          `source=${params.source}`,
          params.eventId ? `eventId=${params.eventId}` : null,
        ]
          .filter(Boolean)
          .join(" | ")
          .slice(0, 280) || null,
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

    // Ledger na mesma transação quando habilitado (idempotente / recuperação externa se falhar)
    if (
      isTerminalApproved(params.internalStatus) &&
      getFinancialFlags().FINANCIAL_LEDGER_ENABLED
    ) {
      const ledger = await postLedgerForApprovedPayment({
        paymentId: payment.id,
        source: params.source,
        tx,
      });
      if (!ledger.ok && ledger.code !== "LEDGER_DISABLED") {
        throw new Error(`LEDGER_POST_FAILED:${ledger.code}`);
      }
    }
  });

  void import("@/lib/loyalty/events").then(({ onOrderStatusForRewards, onOrderRefundedForRewards }) => {
    if (isTerminalApproved(params.internalStatus)) {
      return onOrderStatusForRewards(payment.orderId);
    }
    if (isRefundedStatus(params.internalStatus) || params.internalStatus === "CHARGED_BACK") {
      return onOrderRefundedForRewards({
        orderId: payment.orderId,
        fullRefund: params.internalStatus !== "PARTIALLY_REFUNDED",
      });
    }
    return undefined;
  }).catch(() => undefined);

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
      void import("@/lib/ai-commerce/entitlement-service").then(({ revokeEntitlementsForOrder }) =>
        revokeEntitlementsForOrder(payment.orderId, "CHARGEBACK")
      );
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
      void import("@/lib/ai-commerce/entitlement-service")
        .then(({ grantEntitlementsForPaidOrder }) =>
          grantEntitlementsForPaidOrder(payment.orderId, payment.id)
        )
        .then(async (result) => {
          if (!result.created) return;
          const first = await prisma.aIEntitlement.findFirst({
            where: { orderId: payment.orderId },
            include: { product: { select: { name: true } }, pet: { select: { name: true } } },
          });
          const toolName = first?.product?.name ?? "EccoPet AI";
          await createInternalNotification({
            userId: payment.order.userId,
            title: `${toolName} disponível`,
            body: first?.pet?.name
              ? `Seu ${toolName} está disponível para ${first.pet.name}.`
              : `Seu ${toolName} está disponível.`,
            type: "AI_ENTITLEMENT_CREATED",
            actionUrl: "/minha-conta/ia",
            data: { orderId: payment.order.id },
          });
        })
        .catch(() => undefined);
    }
  } catch {
    /* ignore */
  }

  return { changed: true };
}
