import "server-only";

import { prisma } from "@/lib/prisma";
import { getMercadoPagoChargeback } from "@/lib/mercado-pago/client";
import { createInternalNotification } from "@/lib/notifications/internal";
import { applyInternalPaymentStatus } from "@/lib/mercado-pago/apply-payment-status";
import {
  asJson,
  findPaymentByMpIds,
  sanitizeResourceBody,
} from "@/lib/mercado-pago/webhooks/link-payment";
import type { MpWebhookHandler } from "@/lib/mercado-pago/webhooks/handler-types";
import type { MpDisputeStatus } from "@prisma/client";
import { UserRole } from "@prisma/client";

function mapDisputeStatus(raw: unknown): MpDisputeStatus {
  const s = String(raw || "").toLowerCase();
  if (s.includes("won") || s === "covered") return "WON";
  if (s.includes("lost") || s === "lost") return "LOST";
  if (s.includes("cancel")) return "CANCELLED";
  if (s.includes("evidence")) return "EVIDENCE_REQUIRED";
  if (s.includes("review") || s.includes("in_process")) return "UNDER_REVIEW";
  if (s.includes("open") || s === "opened") return "OPEN";
  return "UNKNOWN";
}

export const handleDisputeWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  const disputeId = normalized.parsed.resourceId;
  if (!disputeId) {
    return {
      processingStatus: "FAILED",
      failureCode: "MISSING_RESOURCE_ID",
      failureReason: "chargeback id ausente",
      retryable: false,
    };
  }

  const paymentProviderId =
    normalized.parsed.data.payment_id != null
      ? String(normalized.parsed.data.payment_id)
      : null;

  const remote = await getMercadoPagoChargeback(disputeId);
  let status: MpDisputeStatus = "OPEN";
  let amount: number | null = null;
  let reason: string | null = null;

  if (remote.ok) {
    await prisma.mpResourceSnapshot.create({
      data: {
        webhookEventId: event.id,
        resourceType: "chargeback",
        resourceId: disputeId,
        source: "api_get",
        sanitizedBody: asJson(sanitizeResourceBody(remote.data)),
      },
    });
    status = mapDisputeStatus(remote.data.status);
    if (typeof remote.data.amount === "number") amount = remote.data.amount;
    reason = remote.data.reason != null ? String(remote.data.reason).slice(0, 280) : null;
  } else if (remote.retryable) {
    return {
      processingStatus: "RETRY_PENDING",
      failureCode: remote.code,
      failureReason: remote.message,
      retryable: true,
    };
  }

  const payment = await findPaymentByMpIds({
    providerPaymentId:
      paymentProviderId ||
      (remote.ok && remote.data.payment_id != null
        ? String(remote.data.payment_id)
        : null),
  });

  const dispute = await prisma.mpDispute.upsert({
    where: { providerDisputeId: String(disputeId) },
    create: {
      providerDisputeId: String(disputeId),
      status,
      reason,
      amount: amount ?? undefined,
      paymentProviderId: paymentProviderId,
      orderId: payment?.orderId ?? null,
      paymentId: payment?.id ?? null,
      partnerId: payment?.partnerId ?? null,
      userId: payment?.userId ?? null,
      webhookEventId: event.id,
      payoutBlocked: true,
      metadata: { apiOk: remote.ok },
    },
    update: {
      status,
      reason,
      amount: amount ?? undefined,
      orderId: payment?.orderId ?? undefined,
      paymentId: payment?.id ?? undefined,
      payoutBlocked: status !== "WON" && status !== "CANCELLED",
      webhookEventId: event.id,
    },
  });

  if (payment && (status === "LOST" || status === "OPEN" || status === "UNDER_REVIEW")) {
    if (status === "LOST") {
      await applyInternalPaymentStatus({
        paymentId: payment.id,
        internalStatus: "CHARGED_BACK",
        statusDetail: `chargeback:${disputeId}`,
        source: "webhook",
      });
    }
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { fulfillmentBlocked: true },
    });
  }

  if (payment?.partnerId) {
    void createInternalNotification({
      userId: payment.partnerId,
      title: "Contestação (chargeback)",
      body: `Contestação aberta no pedido #${payment.order.orderNumber}.`,
      type: "PAYMENT",
      actionUrl: `/partner/financeiro`,
      data: { disputeId: dispute.id },
    });
  }

  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN, accountStatus: "ACTIVE" },
    select: { id: true },
    take: 15,
  });
  for (const a of admins) {
    void createInternalNotification({
      userId: a.id,
      title: "Chargeback Mercado Pago",
      body: `Dispute ${dispute.id} — valor em risco.`,
      type: "SECURITY",
      actionUrl: `/admin/mercado-pago/contestacoes`,
      data: { disputeId: dispute.id },
    });
  }

  return {
    processingStatus: "PROCESSED",
    orderId: payment?.orderId ?? null,
    paymentId: payment?.id ?? null,
    partnerId: payment?.partnerId ?? null,
    userId: payment?.userId ?? null,
  };
};
