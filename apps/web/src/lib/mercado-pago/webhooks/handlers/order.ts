import "server-only";

import { prisma } from "@/lib/prisma";
import { getMercadoPagoOrder } from "@/lib/mercado-pago/client";
import { mapMpOrderStatusToInternal } from "@/lib/mercado-pago/status";
import { applyInternalPaymentStatus } from "@/lib/mercado-pago/apply-payment-status";
import {
  asJson,
  findPaymentByMpIds,
  sanitizeResourceBody,
} from "@/lib/mercado-pago/webhooks/link-payment";
import type { MpWebhookHandler } from "@/lib/mercado-pago/webhooks/handler-types";

export const handleOrderWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  const resourceId = normalized.parsed.resourceId;
  if (!resourceId) {
    return {
      processingStatus: "FAILED",
      failureCode: "MISSING_RESOURCE_ID",
      failureReason: "data.id ausente no webhook de order",
      retryable: false,
    };
  }

  const remote = await getMercadoPagoOrder(resourceId);
  if (!remote.ok) {
    return {
      processingStatus: remote.retryable ? "RETRY_PENDING" : "FAILED",
      failureCode: remote.code,
      failureReason: remote.message,
      retryable: remote.retryable,
    };
  }

  const mp = remote.data;
  await prisma.mpResourceSnapshot.create({
    data: {
      webhookEventId: event.id,
      resourceType: "order",
      resourceId: mp.id,
      source: "api_get",
      sanitizedBody: asJson(sanitizeResourceBody(mp as unknown as Record<string, unknown>)),
    },
  });

  const payment = await findPaymentByMpIds({
    providerOrderId: mp.id,
    providerPaymentId: mp.transactions?.payments?.[0]?.id ?? null,
    externalReference: mp.external_reference ?? null,
  });

  if (!payment) {
    await prisma.mpReconciliationIssue.create({
      data: {
        issueType: "PAYMENT_NOT_FOUND",
        severity: "high",
        message: `Order MP ${mp.id} sem Payment EcoPet`,
        resourceId: mp.id,
        details: { external_reference: mp.external_reference ?? null },
      },
    });
    return {
      processingStatus: "PROCESSED",
      failureCode: "PAYMENT_NOT_FOUND",
      failureReason: "Order consultada; pagamento local ausente (reconciliação)",
    };
  }

  const internal = mapMpOrderStatusToInternal(mp.status, mp.status_detail);
  await applyInternalPaymentStatus({
    paymentId: payment.id,
    internalStatus: internal,
    statusDetail: mp.status_detail,
    providerOrderId: mp.id,
    providerPaymentId: mp.transactions?.payments?.[0]?.id ?? null,
    source: "webhook",
  });

  return {
    processingStatus: "PROCESSED",
    orderId: payment.orderId,
    paymentId: payment.id,
    partnerId: payment.partnerId,
    userId: payment.userId,
  };
};
