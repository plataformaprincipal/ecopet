import "server-only";

import { prisma } from "@/lib/prisma";
import { getMercadoPagoMerchantOrder } from "@/lib/mercado-pago/client";
import {
  asJson,
  findPaymentByMpIds,
  sanitizeResourceBody,
} from "@/lib/mercado-pago/webhooks/link-payment";
import type { MpWebhookHandler } from "@/lib/mercado-pago/webhooks/handler-types";

export const handleCardUpdaterWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  const data = normalized.parsed.data;
  await prisma.mpSubscriptionEvent.create({
    data: {
      topic: "card_updater",
      providerId: String(data.customer_id ?? normalized.parsed.providerEventId ?? event.id),
      status: "RECORDED",
      applicability: "NOT_APPLICABLE",
      webhookEventId: event.id,
      sanitizedData: asJson({
        customer_id: data.customer_id ?? null,
        new_card_id: data.new_card_id ?? null,
        old_card_id: data.old_card_id ?? null,
        note: "EcoPet não armazena cartão; Card Updater não altera cobranças.",
      }),
    },
  });
  return { processingStatus: "NOT_APPLICABLE" };
};

export const handleShipmentWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  const id = normalized.parsed.resourceId || normalized.parsed.providerEventId || event.id;
  await prisma.mpShipment.upsert({
    where: { providerShipmentId: String(id) },
    create: {
      providerShipmentId: String(id),
      status: "NOT_APPLICABLE",
      webhookEventId: event.id,
      metadata: asJson({
        note: "Mercado Envios não contratado; evento registrado sem efeito logístico EcoPet.",
        payload: normalized.sanitizedPayload,
      }),
    },
    update: { webhookEventId: event.id, updatedAt: new Date() },
  });
  return { processingStatus: "NOT_APPLICABLE" };
};

export const handleApplicationLinkWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  await prisma.mpApplicationLink.create({
    data: {
      applicationId: normalized.parsed.applicationId,
      mpUserId: normalized.parsed.mpUserId,
      action: normalized.parsed.action,
      status: normalized.parsed.action?.includes("unlink") ? "REVOKED" : "LINKED",
      webhookEventId: event.id,
      metadata: asJson({
        note: "OAuth split não ativado — sem armazenamento de tokens.",
        sanitized: normalized.sanitizedPayload,
      }),
      revokedAt: normalized.parsed.action?.includes("unlink") ? new Date() : null,
    },
  });
  return { processingStatus: "PROCESSED" };
};

export const handlePayerProfileWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  await prisma.mpPayerProfileEvent.create({
    data: {
      providerId: normalized.parsed.resourceId || event.id,
      status: "RECORDED",
      applicability: "NOT_APPLICABLE",
      webhookEventId: event.id,
      sanitizedData: asJson(normalized.sanitizedPayload),
    },
  });
  return { processingStatus: "NOT_APPLICABLE" };
};

export const handleSubscriptionWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  await prisma.mpSubscriptionEvent.create({
    data: {
      topic: normalized.parsed.rawType,
      providerId: normalized.parsed.resourceId || event.id,
      status: "RECORDED",
      applicability: "NOT_APPLICABLE",
      webhookEventId: event.id,
      sanitizedData: asJson(normalized.sanitizedPayload),
    },
  });
  return { processingStatus: "NOT_APPLICABLE" };
};

export const handleDeliveryWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  await prisma.mpSelfServiceEvent.create({
    data: {
      providerId: normalized.parsed.resourceId || event.id,
      status: "RECORDED",
      applicability: "NOT_APPLICABLE",
      webhookEventId: event.id,
      sanitizedData: asJson({
        kind: "delivery_proximity",
        ...normalized.sanitizedPayload,
      }),
    },
  });
  return { processingStatus: "NOT_APPLICABLE" };
};

export const handleCommercialOrderWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  const id = normalized.parsed.resourceId;
  if (!id) {
    return {
      processingStatus: "FAILED",
      failureCode: "MISSING_RESOURCE_ID",
      failureReason: "merchant_order id ausente",
      retryable: false,
    };
  }

  const remote = await getMercadoPagoMerchantOrder(id);
  if (remote.ok) {
    await prisma.mpResourceSnapshot.create({
      data: {
        webhookEventId: event.id,
        resourceType: "merchant_order",
        resourceId: id,
        source: "api_get",
        sanitizedBody: asJson(sanitizeResourceBody(remote.data)),
      },
    });
  } else if (remote.retryable) {
    return {
      processingStatus: "RETRY_PENDING",
      failureCode: remote.code,
      failureReason: remote.message,
      retryable: true,
    };
  }

  const extRef =
    remote.ok && remote.data.external_reference != null
      ? String(remote.data.external_reference)
      : null;
  const payment = await findPaymentByMpIds({ externalReference: extRef });

  await prisma.mpCommercialOrder.upsert({
    where: { providerMerchantOrderId: id },
    create: {
      providerMerchantOrderId: id,
      status: remote.ok ? String(remote.data.status ?? "UNKNOWN") : "UNKNOWN",
      applicability: "LEGACY_COMPAT",
      orderId: payment?.orderId ?? null,
      paymentId: payment?.id ?? null,
      partnerId: payment?.partnerId ?? null,
      webhookEventId: event.id,
      sanitizedData: asJson(
        remote.ok ? sanitizeResourceBody(remote.data) : normalized.sanitizedPayload
      ),
    },
    update: {
      status: remote.ok ? String(remote.data.status ?? "UNKNOWN") : undefined,
      orderId: payment?.orderId ?? undefined,
      webhookEventId: event.id,
    },
  });

  return {
    processingStatus: "PROCESSED",
    orderId: payment?.orderId ?? null,
    paymentId: payment?.id ?? null,
    partnerId: payment?.partnerId ?? null,
  };
};

export const handlePointWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  await prisma.mpPointEvent.create({
    data: {
      providerId: normalized.parsed.resourceId || event.id,
      status: "RECORDED",
      applicability: "NOT_APPLICABLE",
      webhookEventId: event.id,
      sanitizedData: asJson(normalized.sanitizedPayload),
    },
  });
  return { processingStatus: "NOT_APPLICABLE" };
};

export const handleWalletConnectWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  await prisma.mpWalletEvent.create({
    data: {
      providerId: normalized.parsed.resourceId || event.id,
      status: "RECORDED",
      applicability: "NOT_APPLICABLE",
      webhookEventId: event.id,
      sanitizedData: asJson(normalized.sanitizedPayload),
    },
  });
  return { processingStatus: "NOT_APPLICABLE" };
};

export const handleSelfServiceWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  await prisma.mpSelfServiceEvent.create({
    data: {
      providerId: normalized.parsed.resourceId || event.id,
      status: "RECORDED",
      applicability: "NOT_APPLICABLE",
      webhookEventId: event.id,
      sanitizedData: asJson(normalized.sanitizedPayload),
    },
  });
  return { processingStatus: "NOT_APPLICABLE" };
};

export const handleUnknownWebhook: MpWebhookHandler = async ({ event, normalized }) => {
  await prisma.mpResourceSnapshot.create({
    data: {
      webhookEventId: event.id,
      resourceType: "unknown",
      resourceId: normalized.parsed.resourceId || "none",
      source: "webhook_only",
      sanitizedBody: asJson(normalized.sanitizedPayload),
    },
  });
  return {
    processingStatus: "UNSUPPORTED",
    failureCode: "UNKNOWN_TOPIC",
    failureReason: `Tipo ${normalized.parsed.rawType} sem handler de negócio`,
  };
};
