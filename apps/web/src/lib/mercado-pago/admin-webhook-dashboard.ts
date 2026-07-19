import "server-only";

import { prisma } from "@/lib/prisma";
import { MP_TOPIC_CATALOG } from "@/lib/mercado-pago/webhooks/event-types";
import { getMercadoPagoSanitizedStatus } from "@/lib/mercado-pago/config";

export async function getMercadoPagoWebhookDashboard() {
  const since = new Date(Date.now() - 30 * 24 * 3600_000);
  const [
    received,
    processed,
    failed,
    dead,
    retry,
    fraudOpen,
    claimsOpen,
    disputesOpen,
    byType,
    recent,
    payments,
  ] = await Promise.all([
    prisma.mpWebhookEvent.count({ where: { createdAt: { gte: since } } }),
    prisma.mpWebhookEvent.count({
      where: { createdAt: { gte: since }, processingStatus: "PROCESSED" },
    }),
    prisma.mpWebhookEvent.count({
      where: { createdAt: { gte: since }, processingStatus: "FAILED" },
    }),
    prisma.mpWebhookEvent.count({ where: { processingStatus: "DEAD_LETTER" } }),
    prisma.mpWebhookEvent.count({ where: { processingStatus: "RETRY_PENDING" } }),
    prisma.mpFraudAlert.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.mpClaim.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW", "WAITING_SELLER"] } } }),
    prisma.mpDispute.count({
      where: { status: { in: ["OPEN", "UNDER_REVIEW", "EVIDENCE_REQUIRED"] } },
    }),
    prisma.mpWebhookEvent.groupBy({
      by: ["panelTopic"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.mpWebhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        eventType: true,
        panelTopic: true,
        processingStatus: true,
        signatureValid: true,
        resourceId: true,
        failureReason: true,
        retryCount: true,
        environment: true,
        receivedAt: true,
        orderId: true,
      },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { provider: "mercado_pago" },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const config = getMercadoPagoSanitizedStatus();

  return {
    config,
    catalog: MP_TOPIC_CATALOG.map((t) => ({
      panelKey: t.panelKey,
      panelLabel: t.panelLabel,
      capability: t.capability,
      notes: t.notes,
      aliases: t.typeAliases,
    })),
    metrics: {
      received30d: received,
      processed30d: processed,
      failed30d: failed,
      deadLetters: dead,
      retryPending: retry,
      fraudOpen,
      claimsOpen,
      disputesOpen,
      deliveryRate: received > 0 ? Number((processed / received).toFixed(4)) : null,
      errorRate: received > 0 ? Number((failed / received).toFixed(4)) : null,
    },
    byType: byType.map((r) => ({ topic: r.panelTopic, count: r._count })),
    paymentsByStatus: payments.map((p) => ({
      status: p.status,
      count: p._count,
      amountSum: p._sum.amount,
    })),
    recentEvents: recent,
  };
}
