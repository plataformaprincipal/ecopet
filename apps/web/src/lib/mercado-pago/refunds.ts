import "server-only";

import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getMercadoPagoLegacyPayment,
  newIdempotencyKey,
  refundMercadoPagoLegacyPayment,
} from "@/lib/mercado-pago/client";
import { writeAuditLog } from "@/lib/audit-log";
import { createInternalNotification } from "@/lib/notifications/internal";

const LOCK_MS = 30_000;
const MONEY_EPS = 0.009;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function refundableBalance(payment: {
  amount: number;
  refundedAmount: number;
  status: string;
}): number {
  if (payment.status !== "APPROVED" && payment.status !== "PARTIALLY_REFUNDED") {
    return 0;
  }
  return Math.max(0, round2(payment.amount - (payment.refundedAmount || 0)));
}

async function acquireRefundLock(paymentId: string, adminId: string): Promise<boolean> {
  const now = new Date();
  const until = new Date(now.getTime() + LOCK_MS);
  const result = await prisma.payment.updateMany({
    where: {
      id: paymentId,
      OR: [{ refundLockUntil: null }, { refundLockUntil: { lt: now } }, { refundLockBy: adminId }],
    },
    data: { refundLockUntil: until, refundLockBy: adminId },
  });
  return result.count === 1;
}

async function releaseRefundLock(paymentId: string, adminId: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { id: paymentId, refundLockBy: adminId },
    data: { refundLockUntil: null, refundLockBy: null },
  });
}

export type ExecuteRefundInput = {
  paymentId: string;
  adminId: string;
  amount?: number;
  reason: string;
  internalReason?: string;
  /** Se true, estorna todo o saldo reembolsável. */
  full?: boolean;
  paymentRefundId?: string;
};

/**
 * Estorno total ou parcial via Payments API (refunds).
 * Consulta o recurso remoto antes; idempotência por chave; lock lógico anti-concorrência.
 * Estoque NÃO é devolvido automaticamente (stockReturnStatus = PENDING_RETURN / NOT_REQUIRED).
 */
export async function executePaymentRefund(input: ExecuteRefundInput): Promise<{
  ok: boolean;
  code: string;
  message: string;
  paymentRefundId?: string;
  refundedAmount?: number;
  balanceAfter?: number;
}> {
  const reason = input.reason.trim();
  if (reason.length < 5) {
    return { ok: false, code: "REASON_REQUIRED", message: "Informe um motivo (mín. 5 caracteres)." };
  }

  const locked = await acquireRefundLock(input.paymentId, input.adminId);
  if (!locked) {
    return {
      ok: false,
      code: "REFUND_LOCKED",
      message: "Outro administrador está processando estorno neste pagamento. Aguarde.",
    };
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: input.paymentId },
      include: {
        order: { select: { id: true, userId: true, partnerId: true, orderNumber: true, status: true } },
      },
    });
    if (!payment) return { ok: false, code: "NOT_FOUND", message: "Pagamento não encontrado." };
    if (payment.provider !== "mercado_pago") {
      return { ok: false, code: "PROVIDER", message: "Estorno disponível apenas para Mercado Pago." };
    }
    if (!payment.providerPaymentId) {
      return {
        ok: false,
        code: "NO_PROVIDER_PAYMENT",
        message: "Pagamento sem ID no provedor. Consulte/reconcilie antes de estornar.",
      };
    }

    const balance = refundableBalance(payment);
    if (balance <= MONEY_EPS) {
      return { ok: false, code: "NOTHING_TO_REFUND", message: "Não há saldo reembolsável." };
    }

    const amount = input.full
      ? balance
      : input.amount !== undefined
        ? round2(input.amount)
        : balance;

    if (!(amount > MONEY_EPS) || amount > balance + MONEY_EPS) {
      return {
        ok: false,
        code: "INVALID_AMOUNT",
        message: `Valor inválido. Saldo reembolsável: R$ ${balance.toFixed(2)}.`,
      };
    }

    // Consulta oficial antes de estornar
    const remote = await getMercadoPagoLegacyPayment(payment.providerPaymentId);
    if (!remote.ok) {
      return {
        ok: false,
        code: remote.code,
        message: remote.message || "Falha ao consultar pagamento no Mercado Pago.",
      };
    }
    const remoteStatus = String(remote.data.status ?? "");
    if (remoteStatus !== "approved") {
      return {
        ok: false,
        code: "REMOTE_NOT_APPROVED",
        message: `Pagamento remoto não está aprovado (status: ${remoteStatus}).`,
      };
    }

    const isFull = amount >= balance - MONEY_EPS;

    let refundRow = input.paymentRefundId
      ? await prisma.paymentRefund.findUnique({ where: { id: input.paymentRefundId } })
      : null;

    const idempotencyKey = refundRow?.idempotencyKey || newIdempotencyKey();

    if (!refundRow) {
      refundRow = await prisma.paymentRefund.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          buyerUserId: payment.order.userId,
          type: isFull ? "FULL" : "PARTIAL",
          amount,
          reason,
          internalReason: input.internalReason?.slice(0, 500),
          requestedById: input.adminId,
          approvedById: input.adminId,
          status: "PROCESSING",
          idempotencyKey,
          stockReturnStatus: "NOT_REQUIRED",
        },
      });
    } else {
      await prisma.paymentRefund.update({
        where: { id: refundRow.id },
        data: {
          status: "PROCESSING",
          approvedById: input.adminId,
          amount,
          type: isFull ? "FULL" : "PARTIAL",
          reason,
        },
      });
    }

    const mpResult = await refundMercadoPagoLegacyPayment(
      payment.providerPaymentId,
      refundRow.idempotencyKey || idempotencyKey,
      isFull ? undefined : amount
    );

    if (!mpResult.ok) {
      await prisma.paymentRefund.update({
        where: { id: refundRow.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          failureCode: mpResult.code,
          failureReason: mpResult.message.slice(0, 280),
        },
      });
      return { ok: false, code: mpResult.code, message: mpResult.message, paymentRefundId: refundRow.id };
    }

    const providerRefundId =
      (mpResult.data.id != null ? String(mpResult.data.id) : null) ||
      (typeof mpResult.data === "object" && mpResult.data && "id" in mpResult.data
        ? String((mpResult.data as { id: unknown }).id)
        : null);

    const newRefunded = round2((payment.refundedAmount || 0) + amount);
    const fullyRefunded = newRefunded >= round2(payment.amount) - MONEY_EPS;
    const paymentStatus = fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED";
    const orderStatus = fullyRefunded ? OrderStatus.REFUNDED : OrderStatus.PARTIALLY_REFUNDED;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: newRefunded,
          status: paymentStatus,
          refundedAt: fullyRefunded ? new Date() : payment.refundedAt,
          statusDetail: isFull ? "refunded" : "partially_refunded",
        },
      });
      await tx.paymentRefund.update({
        where: { id: refundRow!.id },
        data: {
          status: fullyRefunded ? "FULLY_REFUNDED" : "APPROVED",
          providerRefundId,
          providerStatus: String(mpResult.data.status ?? "approved"),
          processedAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: orderStatus },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: orderStatus,
          note: `Estorno ${isFull ? "total" : "parcial"} R$ ${amount.toFixed(2)} (admin)`,
        },
      });
      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          provider: "mercado_pago",
          eventType: isFull ? "refund:full" : "refund:partial",
          status: paymentStatus,
          message: reason.slice(0, 280),
          metadata: { amount, providerRefundId } as Prisma.InputJsonValue,
        },
      });
    });

    void writeAuditLog({
      actorId: input.adminId,
      action: "UPDATE",
      module: "payments.refund",
      resource: "PaymentRefund",
      resourceId: refundRow.id,
      observation: `${isFull ? "FULL" : "PARTIAL"} ${amount.toFixed(2)}`,
    }).catch(() => undefined);

    try {
      await createInternalNotification({
        userId: payment.order.userId,
        title: isFull ? "Estorno concluído" : "Estorno parcial processado",
        body: `Pedido #${payment.order.orderNumber}: R$ ${amount.toFixed(2)} estornado. O prazo de disponibilização depende do meio e da instituição financeira.`,
        type: "PAYMENT_REFUNDED",
        actionUrl: `/cliente/financeiro`,
        data: { orderId: payment.orderId, paymentId: payment.id, amount },
      });
      if (payment.order.partnerId) {
        await createInternalNotification({
          userId: payment.order.partnerId,
          title: "Estorno no pedido",
          body: `Pedido #${payment.order.orderNumber}: estorno de R$ ${amount.toFixed(2)}.`,
          type: "ORDER_REFUNDED",
          actionUrl: `/partner/financeiro`,
          data: { orderId: payment.orderId, amount },
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const { claimTransactionalEvent } = await import(
        "@/lib/server/gtm/deduplication-service"
      );
      await claimTransactionalEvent({
        eventName: "refund",
        entityType: "payment_refund",
        entityId: refundRow.id,
      });
    } catch {
      /* claim analítico best-effort — não afeta estorno MP */
    }

    return {
      ok: true,
      code: "OK",
      message: isFull ? "Estorno total processado." : "Estorno parcial processado.",
      paymentRefundId: refundRow.id,
      refundedAmount: amount,
      balanceAfter: round2(payment.amount - newRefunded),
    };
  } finally {
    await releaseRefundLock(input.paymentId, input.adminId);
  }
}

/** Cliente solicita estorno — não chama MP até aprovação admin. */
export async function requestClientRefund(input: {
  orderId: string;
  userId: string;
  reason: string;
  amount?: number;
}): Promise<{ ok: boolean; code: string; message: string; paymentRefundId?: string }> {
  const reason = input.reason.trim();
  if (reason.length < 5) {
    return { ok: false, code: "REASON_REQUIRED", message: "Informe um motivo." };
  }

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      payments: {
        where: { provider: "mercado_pago", status: { in: ["APPROVED", "PARTIALLY_REFUNDED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!order || order.userId !== input.userId) {
    return { ok: false, code: "FORBIDDEN", message: "Pedido não encontrado." };
  }
  const payment = order.payments[0];
  if (!payment) {
    return { ok: false, code: "NO_PAYMENT", message: "Não há pagamento aprovado para estorno." };
  }

  const balance = refundableBalance(payment);
  const amount = input.amount !== undefined ? round2(input.amount) : balance;
  if (!(amount > MONEY_EPS) || amount > balance + MONEY_EPS) {
    return { ok: false, code: "INVALID_AMOUNT", message: "Valor inválido para solicitação." };
  }

  const existing = await prisma.paymentRefund.findFirst({
    where: {
      paymentId: payment.id,
      status: { in: ["REQUESTED", "UNDER_REVIEW", "PROCESSING"] },
    },
  });
  if (existing) {
    return {
      ok: false,
      code: "ALREADY_REQUESTED",
      message: "Já existe uma solicitação de estorno em análise.",
      paymentRefundId: existing.id,
    };
  }

  const row = await prisma.paymentRefund.create({
    data: {
      paymentId: payment.id,
      orderId: order.id,
      buyerUserId: input.userId,
      type: amount >= balance - MONEY_EPS ? "FULL" : "PARTIAL",
      amount,
      reason,
      requestedById: input.userId,
      status: "REQUESTED",
      stockReturnStatus: "PENDING_RETURN",
      idempotencyKey: `req_${payment.id}_${input.userId}_${Date.now()}`.slice(0, 64),
    },
  });

  return {
    ok: true,
    code: "OK",
    message: "Solicitação registrada. Aguarde análise administrativa.",
    paymentRefundId: row.id,
  };
}
