import "server-only";

import { prisma } from "@/lib/prisma";

export type FinanceOpsAlert = {
  code: string;
  severity: "P0" | "P1" | "P2";
  message: string;
  orderId?: string;
  paymentId?: string;
  partnerId?: string;
};

/**
 * Varredura determinística (janela limitada). Não carrega a base inteira.
 */
export async function scanFinanceOpsAlerts(opts?: { lookbackHours?: number; take?: number }) {
  const lookbackHours = Math.min(168, Math.max(1, opts?.lookbackHours ?? 48));
  const take = Math.min(200, Math.max(10, opts?.take ?? 80));
  const since = new Date(Date.now() - lookbackHours * 3600_000);
  const alerts: FinanceOpsAlert[] = [];

  const [inconsistentPayments, paidWithoutPayment, mismatches, failedPayouts, disconnected] =
    await Promise.all([
      prisma.payment.findMany({
        where: {
          createdAt: { gte: since },
          provider: "mercado_pago",
          status: "APPROVED",
          providerOrderId: null,
          providerPaymentId: null,
        },
        take: 40,
        select: { id: true, partnerId: true, orderId: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: since },
          status: "PAID",
          payments: { none: { status: "APPROVED" } },
        },
        take,
        select: { id: true, partnerId: true, orderNumber: true },
      }),
      prisma.financialReconciliation.findMany({
        where: {
          createdAt: { gte: since },
          status: { in: ["VALUE_MISMATCH", "STATUS_MISMATCH", "REFUND_MISMATCH"] },
        },
        take,
        select: { paymentId: true, orderId: true, status: true, summary: true },
      }),
      prisma.partnerPayout.findMany({
        where: { status: "FAILED", requestedAt: { gte: since } },
        take: 40,
        select: { id: true, partnerId: true, failureReason: true },
      }),
      prisma.partnerMpConnection.findMany({
        where: { status: { in: ["ERROR", "REAUTH_REQUIRED"] } },
        take: 40,
        select: { partnerId: true, status: true, lastError: true },
      }),
    ]);

  for (const p of inconsistentPayments) {
    alerts.push({
      code: "WEBHOOK_INCONSISTENT",
      severity: "P1",
      message: "Payment APPROVED sem ID do Mercado Pago.",
      paymentId: p.id,
      orderId: p.orderId,
      partnerId: p.partnerId ?? undefined,
    });
  }
  for (const o of paidWithoutPayment) {
    alerts.push({
      code: "ORDER_WITHOUT_APPROVED_PAYMENT",
      severity: "P0",
      message: `Pedido ${o.orderNumber} PAID sem payment APPROVED.`,
      orderId: o.id,
      partnerId: o.partnerId ?? undefined,
    });
  }
  for (const r of mismatches) {
    alerts.push({
      code: "AMOUNT_OR_STATUS_MISMATCH",
      severity: "P1",
      message: r.summary ?? r.status,
      orderId: r.orderId ?? undefined,
      paymentId: r.paymentId ?? undefined,
    });
  }
  for (const p of failedPayouts) {
    alerts.push({
      code: "PAYOUT_FAILED",
      severity: "P1",
      message: p.failureReason ?? "Repasse sandbox falhou.",
      partnerId: p.partnerId,
    });
  }
  for (const c of disconnected) {
    alerts.push({
      code: "SELLER_MP_DISCONNECTED",
      severity: "P2",
      message: c.lastError ?? c.status,
      partnerId: c.partnerId,
    });
  }

  return { since: since.toISOString(), count: alerts.length, alerts };
}
