import "server-only";

import { prisma } from "@/lib/prisma";

export async function runMercadoPagoReconciliation(params?: { limit?: number }) {
  const limit = params?.limit ?? 50;
  let issuesCreated = 0;

  // Pedidos PAID sem Payment APPROVED
  const paidOrders = await prisma.order.findMany({
    where: { status: "PAID" },
    select: {
      id: true,
      total: true,
      payments: {
        where: { provider: "mercado_pago" },
        select: { id: true, status: true, amount: true },
      },
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  for (const order of paidOrders) {
    const approved = order.payments.find((p) => p.status === "APPROVED");
    if (!approved && order.payments.length > 0) {
      await prisma.mpReconciliationIssue.create({
        data: {
          issueType: "ORDER_PAID_WITHOUT_APPROVED_PAYMENT",
          severity: "high",
          orderId: order.id,
          message: "Pedido PAID sem Payment APPROVED do Mercado Pago",
        },
      });
      issuesCreated += 1;
    }
    if (approved && Math.abs(approved.amount - order.total) > 0.05) {
      await prisma.mpReconciliationIssue.create({
        data: {
          issueType: "AMOUNT_MISMATCH",
          severity: "high",
          orderId: order.id,
          paymentId: approved.id,
          message: `Valor divergente: order=${order.total} payment=${approved.amount}`,
          details: { orderTotal: order.total, paymentAmount: approved.amount },
        },
      });
      issuesCreated += 1;
    }
  }

  // Payments APPROVED com order não PAID
  const approvedPayments = await prisma.payment.findMany({
    where: { provider: "mercado_pago", status: "APPROVED" },
    include: { order: { select: { id: true, status: true } } },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
  for (const p of approvedPayments) {
    if (p.order.status !== "PAID" && p.order.status !== "REFUNDED") {
      await prisma.mpReconciliationIssue.create({
        data: {
          issueType: "PAYMENT_APPROVED_ORDER_NOT_PAID",
          severity: "high",
          orderId: p.orderId,
          paymentId: p.id,
          message: `Payment APPROVED com order ${p.order.status}`,
        },
      });
      issuesCreated += 1;
    }
  }

  // Dead letters
  const dead = await prisma.mpWebhookEvent.count({
    where: { processingStatus: "DEAD_LETTER" },
  });

  // Eventos falhos recentes sem retry
  const failed = await prisma.mpWebhookEvent.count({
    where: {
      processingStatus: { in: ["FAILED", "RETRY_PENDING"] },
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600_000) },
    },
  });

  return {
    issuesCreated,
    deadLetters: dead,
    failedOrRetry: failed,
    checkedAt: new Date().toISOString(),
  };
}
