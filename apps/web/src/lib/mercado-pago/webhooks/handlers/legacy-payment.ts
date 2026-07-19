import "server-only";

import { prisma } from "@/lib/prisma";
import { getMercadoPagoLegacyPayment, getMercadoPagoOrder } from "@/lib/mercado-pago/client";
import { mapMpOrderStatusToInternal } from "@/lib/mercado-pago/status";
import { applyInternalPaymentStatus } from "@/lib/mercado-pago/apply-payment-status";
import {
  asJson,
  findPaymentByMpIds,
  sanitizeResourceBody,
} from "@/lib/mercado-pago/webhooks/link-payment";
import type { MpWebhookHandler } from "@/lib/mercado-pago/webhooks/handler-types";
import type { InternalPaymentStatus } from "@/lib/mercado-pago/status";

function mapLegacyPaymentStatus(status: unknown): InternalPaymentStatus {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return "APPROVED";
  if (s === "rejected" || s === "cancelled") return s === "cancelled" ? "CANCELLED" : "REJECTED";
  if (s === "refunded" || s === "charged_back") return s === "charged_back" ? "CHARGED_BACK" : "REFUNDED";
  if (s === "in_process" || s === "in_mediation") return "PROCESSING";
  if (s === "pending") return "PENDING";
  return "PENDING";
}

/**
 * Topic `payment` — Payments API legada.
 * Se já existe Order MP vinculada, preferir GET /v1/orders para não duplicar efeitos.
 */
export const handleLegacyPaymentWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  const resourceId = normalized.parsed.resourceId;
  if (!resourceId) {
    return {
      processingStatus: "FAILED",
      failureCode: "MISSING_RESOURCE_ID",
      failureReason: "payment id ausente",
      retryable: false,
    };
  }

  const remote = await getMercadoPagoLegacyPayment(resourceId);
  if (!remote.ok) {
    return {
      processingStatus: remote.retryable ? "RETRY_PENDING" : "FAILED",
      failureCode: remote.code,
      failureReason: remote.message,
      retryable: remote.retryable,
    };
  }

  const pay = remote.data;
  await prisma.mpResourceSnapshot.create({
    data: {
      webhookEventId: event.id,
      resourceType: "payment_legacy",
      resourceId,
      source: "api_get",
      sanitizedBody: asJson(sanitizeResourceBody(pay)),
    },
  });

  const orderIdFromPay =
    pay.order && typeof pay.order === "object" && (pay.order as { id?: string }).id
      ? String((pay.order as { id: string }).id)
      : null;
  const externalRef = pay.external_reference != null ? String(pay.external_reference) : null;

  let payment = await findPaymentByMpIds({
    providerPaymentId: resourceId,
    providerOrderId: orderIdFromPay,
    externalReference: externalRef,
  });

  // Preferir order se já existir providerOrderId
  if (payment?.providerOrderId) {
    const orderRemote = await getMercadoPagoOrder(payment.providerOrderId);
    if (orderRemote.ok) {
      const internal = mapMpOrderStatusToInternal(
        orderRemote.data.status,
        orderRemote.data.status_detail
      );
      await applyInternalPaymentStatus({
        paymentId: payment.id,
        internalStatus: internal,
        statusDetail: `legacy_payment_bridged:${orderRemote.data.status_detail ?? ""}`,
        providerOrderId: orderRemote.data.id,
        providerPaymentId: resourceId,
        source: "webhook",
      });
      return {
        processingStatus: "PROCESSED",
        orderId: payment.orderId,
        paymentId: payment.id,
        partnerId: payment.partnerId,
        userId: payment.userId,
      };
    }
  }

  if (!payment) {
    await prisma.mpReconciliationIssue.create({
      data: {
        issueType: "LEGACY_PAYMENT_ORPHAN",
        severity: "medium",
        message: `Payment legacy ${resourceId} sem vínculo EcoPet`,
        resourceId,
        details: { external_reference: externalRef, source: "PAYMENTS_LEGACY" },
      },
    });
    return {
      processingStatus: "PROCESSED",
      failureCode: "ORPHAN_LEGACY_PAYMENT",
      failureReason: "Pagamento legacy sem pedido — apenas snapshot",
    };
  }

  const internal = mapLegacyPaymentStatus(pay.status);
  await applyInternalPaymentStatus({
    paymentId: payment.id,
    internalStatus: internal,
    statusDetail: `PAYMENTS_LEGACY:${String(pay.status_detail ?? pay.status ?? "")}`,
    providerPaymentId: resourceId,
    source: "webhook",
  });

  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      orderId: payment.orderId,
      provider: "mercado_pago",
      eventType: "legacy_payment_webhook",
      status: internal,
      message: "Origem: PAYMENTS_LEGACY",
      metadata: { api: "PAYMENTS_LEGACY" },
    },
  });

  return {
    processingStatus: "PROCESSED",
    orderId: payment.orderId,
    paymentId: payment.id,
    partnerId: payment.partnerId,
    userId: payment.userId,
  };
};
