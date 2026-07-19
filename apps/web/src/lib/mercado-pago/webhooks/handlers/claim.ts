import "server-only";

import { prisma } from "@/lib/prisma";
import { getMercadoPagoClaim } from "@/lib/mercado-pago/client";
import { createInternalNotification } from "@/lib/notifications/internal";
import {
  asJson,
  findPaymentByMpIds,
  sanitizeResourceBody,
} from "@/lib/mercado-pago/webhooks/link-payment";
import type { MpWebhookHandler } from "@/lib/mercado-pago/webhooks/handler-types";
import type { MpClaimStatus } from "@prisma/client";

function mapClaimStatus(raw: unknown): MpClaimStatus {
  const s = String(raw || "").toLowerCase();
  if (s.includes("close") || s === "closed") return "CLOSED";
  if (s.includes("resolv")) return "RESOLVED";
  if (s.includes("seller")) return "WAITING_SELLER";
  if (s.includes("buyer")) return "WAITING_BUYER";
  if (s.includes("review") || s.includes("opened") || s === "opened") return "UNDER_REVIEW";
  if (s.includes("open")) return "OPEN";
  return "UNKNOWN";
}

export const handleClaimWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  const claimId = normalized.parsed.resourceId;
  if (!claimId) {
    return {
      processingStatus: "FAILED",
      failureCode: "MISSING_RESOURCE_ID",
      failureReason: "claim id ausente",
      retryable: false,
    };
  }

  const remote = await getMercadoPagoClaim(claimId);
  let status: MpClaimStatus = "OPEN";
  let reason: string | null = null;
  let amount: number | null = null;
  let paymentProviderId: string | null =
    normalized.parsed.data.payment_id != null
      ? String(normalized.parsed.data.payment_id)
      : null;

  if (remote.ok) {
    await prisma.mpResourceSnapshot.create({
      data: {
        webhookEventId: event.id,
        resourceType: "claim",
        resourceId: claimId,
        source: "api_get",
        sanitizedBody: asJson(sanitizeResourceBody(remote.data)),
      },
    });
    status = mapClaimStatus(remote.data.status);
    reason =
      remote.data.reason != null
        ? String(remote.data.reason).slice(0, 280)
        : remote.data.type != null
          ? String(remote.data.type).slice(0, 280)
          : null;
    if (typeof remote.data.amount === "number") amount = remote.data.amount;
    if (remote.data.payments && Array.isArray(remote.data.payments) && remote.data.payments[0]) {
      const p0 = remote.data.payments[0] as { id?: string | number };
      if (p0.id != null) paymentProviderId = String(p0.id);
    }
  } else if (remote.retryable) {
    return {
      processingStatus: "RETRY_PENDING",
      failureCode: remote.code,
      failureReason: remote.message,
      retryable: true,
    };
  }

  const payment = await findPaymentByMpIds({ providerPaymentId: paymentProviderId });

  const claim = await prisma.mpClaim.upsert({
    where: { providerClaimId: claimId },
    create: {
      providerClaimId: claimId,
      status,
      reason,
      description: typeof normalized.parsed.data.description === "string"
        ? normalized.parsed.data.description.slice(0, 500)
        : null,
      amount: amount ?? undefined,
      orderId: payment?.orderId ?? null,
      paymentId: payment?.id ?? null,
      partnerId: payment?.partnerId ?? null,
      userId: payment?.userId ?? null,
      webhookEventId: event.id,
      metadata: { apiOk: remote.ok },
    },
    update: {
      status,
      reason,
      amount: amount ?? undefined,
      orderId: payment?.orderId ?? undefined,
      paymentId: payment?.id ?? undefined,
      webhookEventId: event.id,
    },
  });

  if (payment?.userId) {
    void createInternalNotification({
      userId: payment.userId,
      title: "Reclamação registrada",
      body: `Há uma reclamação vinculada ao pedido #${payment.order.orderNumber}.`,
      type: "ORDER",
      actionUrl: `/cliente/financeiro`,
      data: { claimId: claim.id, orderId: payment.orderId },
    });
  }
  if (payment?.partnerId) {
    void createInternalNotification({
      userId: payment.partnerId,
      title: "Reclamação do comprador",
      body: `Reclamação no pedido #${payment.order.orderNumber}. Responda no prazo.`,
      type: "ORDER",
      actionUrl: `/partner/financeiro`,
      data: { claimId: claim.id, orderId: payment.orderId },
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
