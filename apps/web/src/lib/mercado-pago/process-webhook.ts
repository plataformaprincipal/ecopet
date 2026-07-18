import "server-only";

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoOrder } from "@/lib/mercado-pago/client";
import { hashPayload } from "@/lib/mercado-pago/crypto-utils";
import { verifyMercadoPagoWebhookSignature } from "@/lib/mercado-pago/webhook-signature";
import { mapMpOrderStatusToInternal } from "@/lib/mercado-pago/status";
import { applyInternalPaymentStatus } from "@/lib/mercado-pago/apply-payment-status";
import { writeIntegrationLog } from "@/lib/integrations/log";

export type ProcessMpWebhookResult = {
  ok: boolean;
  status: number;
  code: string;
  duplicate?: boolean;
  webhookEventId?: string;
};

function extractDataId(payload: Record<string, unknown>): string | null {
  const data = payload.data as { id?: string | number } | undefined;
  if (data?.id != null) return String(data.id);
  if (payload.id != null) return String(payload.id);
  return null;
}

/**
 * Processa webhook Mercado Pago:
 * 1) valida assinatura (quando secret configurado)
 * 2) persiste evento com idempotência
 * 3) consulta order na API (fonte da verdade)
 * 4) atualiza Payment/Order
 */
export async function processMercadoPagoWebhook(params: {
  rawBody: string;
  headers: Headers;
}): Promise<ProcessMpWebhookResult> {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(params.rawBody) as Record<string, unknown>;
  } catch {
    return { ok: false, status: 400, code: "INVALID_PAYLOAD" };
  }

  const dataId = extractDataId(payload);
  const xSignature = params.headers.get("x-signature");
  const xRequestId = params.headers.get("x-request-id");
  const eventType = String(payload.type ?? payload.action ?? payload.topic ?? "unknown");

  const signature = verifyMercadoPagoWebhookSignature({
    xSignature,
    xRequestId,
    dataId,
  });

  const secretConfigured = signature.reason !== "WEBHOOK_SECRET_MISSING";
  if (secretConfigured && !signature.valid) {
    await writeIntegrationLog({
      integrationName: "mercado_pago",
      provider: "mercado_pago",
      action: "webhook:signature",
      status: "error",
      message: signature.reason ?? "INVALID_SIGNATURE",
    }).catch(() => undefined);
    return { ok: false, status: 401, code: signature.reason ?? "INVALID_SIGNATURE" };
  }

  const payloadHash = hashPayload(params.rawBody);
  const idempotencyKey =
    xRequestId?.trim() ||
    (dataId ? `mp:${eventType}:${dataId}:${createHash("sha256").update(params.rawBody).digest("hex").slice(0, 16)}` : null);

  if (idempotencyKey) {
    const dup = await prisma.webhookEvent.findUnique({ where: { idempotencyKey } });
    if (dup) {
      return {
        ok: true,
        status: 200,
        code: "DUPLICATE",
        duplicate: true,
        webhookEventId: dup.id,
      };
    }
  }

  // Payload sanitizado — não guardar headers/secrets
  const sanitizedPayload = {
    type: eventType,
    action: payload.action ?? null,
    data: dataId ? { id: dataId } : null,
    live_mode: payload.live_mode ?? null,
    user_id: typeof payload.user_id === "string" || typeof payload.user_id === "number" ? payload.user_id : null,
    api_version: payload.api_version ?? null,
  };

  const event = await prisma.webhookEvent.create({
    data: {
      provider: "mercado_pago",
      eventType,
      externalId: dataId,
      payload: sanitizedPayload,
      payloadHash,
      idempotencyKey: idempotencyKey ?? undefined,
      status: "PENDING",
      attemptCount: 1,
    },
  });

  // Resposta rápida: processar sync (consulta API) — se falhar, marca FAILED sem 5xx desnecessário
  try {
    if (!dataId) {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          failureReason: "MISSING_RESOURCE_ID",
          errorMessage: "data.id ausente",
          processedAt: new Date(),
        },
      });
      return { ok: true, status: 200, code: "ACK_NO_RESOURCE", webhookEventId: event.id };
    }

    // Preferir order id; alguns webhooks notificam payment — tentamos order primeiro
    const remote = await getMercadoPagoOrder(dataId);
    if (!remote.ok) {
      // Em teste, resource pode ser payment id — localizar Payment por providerPaymentId
      const byPayment = await prisma.payment.findFirst({
        where: {
          provider: "mercado_pago",
          OR: [{ providerOrderId: dataId }, { providerPaymentId: dataId }, { externalId: dataId }],
        },
      });
      if (!byPayment) {
        await prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            status: "FAILED",
            failureReason: remote.code,
            errorMessage: remote.message,
            processedAt: new Date(),
            attemptCount: { increment: 1 },
          },
        });
        return { ok: true, status: 200, code: "ACK_LOOKUP_FAILED", webhookEventId: event.id };
      }

      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
      return { ok: true, status: 200, code: "ACK_PAYMENT_LINKED", webhookEventId: event.id };
    }

    const mp = remote.data;
    const externalRef = mp.external_reference ?? "";
    const orderIdFromRef = externalRef.startsWith("ecopet_")
      ? externalRef.replace(/^ecopet_/, "")
      : null;

    const payment = await prisma.payment.findFirst({
      where: {
        provider: "mercado_pago",
        OR: [
          { providerOrderId: mp.id },
          { externalId: mp.id },
          ...(orderIdFromRef ? [{ orderId: orderIdFromRef }] : []),
          ...(externalRef ? [{ externalReference: externalRef }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!payment) {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          failureReason: "PAYMENT_NOT_FOUND",
          errorMessage: "Pagamento local não encontrado",
          processedAt: new Date(),
        },
      });
      return { ok: true, status: 200, code: "ACK_NO_LOCAL_PAYMENT", webhookEventId: event.id };
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

    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    await writeIntegrationLog({
      integrationName: "mercado_pago",
      provider: "mercado_pago",
      action: `webhook:${eventType}`,
      status: "success",
      message: `Order ${mp.id} → ${internal}`,
      metadata: { webhookEventId: event.id, paymentId: payment.id },
    }).catch(() => undefined);

    return { ok: true, status: 200, code: "PROCESSED", webhookEventId: event.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 280) : "WEBHOOK_ERROR";
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        failureReason: "PROCESSING_ERROR",
        errorMessage: msg,
        processedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
    return { ok: true, status: 200, code: "ACK_ERROR", webhookEventId: event.id };
  }
}
