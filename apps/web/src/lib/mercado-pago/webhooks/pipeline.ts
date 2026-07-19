import "server-only";

import { prisma } from "@/lib/prisma";
import { hashPayload } from "@/lib/mercado-pago/crypto-utils";
import { getMercadoPagoEnvironment } from "@/lib/mercado-pago/config";
import { verifyMercadoPagoWebhookSignature } from "@/lib/mercado-pago/webhooks/verify-signature";
import { normalizeMercadoPagoWebhook } from "@/lib/mercado-pago/webhooks/normalize-event";
import { findDuplicateMpWebhook } from "@/lib/mercado-pago/webhooks/idempotency";
import { getWebhookHandler } from "@/lib/mercado-pago/webhooks/event-router";
import { writeIntegrationLog } from "@/lib/integrations/log";
import { enqueueJob } from "@/lib/jobs/job-queue";
import type { MpWebhookProcessingStatus } from "@prisma/client";
import { asJson } from "@/lib/mercado-pago/webhooks/link-payment";

export type PipelineResult = {
  ok: boolean;
  status: number;
  code: string;
  duplicate?: boolean;
  webhookEventId?: string;
};

const MAX_BODY = 256_000;

export async function runMercadoPagoWebhookPipeline(params: {
  rawBody: string;
  headers: Headers;
}): Promise<PipelineResult> {
  if (params.rawBody.length > MAX_BODY) {
    return { ok: false, status: 413, code: "PAYLOAD_TOO_LARGE" };
  }

  const normalized = normalizeMercadoPagoWebhook(params.rawBody);
  if (!normalized) {
    return { ok: false, status: 400, code: "INVALID_PAYLOAD" };
  }

  const xSignature = params.headers.get("x-signature");
  const xRequestId = params.headers.get("x-request-id");
  const dataIdForSig =
    normalized.parsed.resourceId ||
    (normalized.parsed.data.payment_id != null
      ? String(normalized.parsed.data.payment_id)
      : null);

  const signature = verifyMercadoPagoWebhookSignature({
    xSignature,
    xRequestId,
    dataId: dataIdForSig,
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

    // Persist rejected attempt for admin visibility (no financial effect)
    await prisma.mpWebhookEvent
      .create({
        data: {
          environment: getMercadoPagoEnvironment(),
          eventType: normalized.parsed.rawType,
          panelTopic: normalized.panelKey,
          action: normalized.parsed.action,
          providerEventId: normalized.parsed.providerEventId,
          resourceType: normalized.resourceType,
          resourceId: normalized.parsed.resourceId,
          applicationId: normalized.parsed.applicationId,
          mpUserId: normalized.parsed.mpUserId,
          requestId: xRequestId,
          payloadHash: hashPayload(params.rawBody),
          signatureValid: false,
          liveMode: normalized.parsed.liveMode,
          processingStatus: "FAILED",
          failureCode: signature.reason ?? "INVALID_SIGNATURE",
          failureReason: "Assinatura inválida — evento rejeitado",
          sanitizedPayload: asJson(normalized.sanitizedPayload),
          processedAt: new Date(),
        },
      })
      .catch(() => undefined);

    return { ok: false, status: 401, code: signature.reason ?? "INVALID_SIGNATURE" };
  }

  // Ambiente: rejeitar live_mode=true quando EcoPet está em test (e vice-versa soft)
  const env = getMercadoPagoEnvironment();
  if (normalized.parsed.liveMode === true && env === "test") {
    // Aceita registro mas marca IGNORED — não altera financeiro produtivo
  }

  const payloadHash = hashPayload(params.rawBody);
  const dup = await findDuplicateMpWebhook({
    providerEventId: normalized.parsed.providerEventId,
    eventType: normalized.parsed.rawType,
    resourceId: normalized.parsed.resourceId,
    payloadHash,
  });
  if (dup) {
    return {
      ok: true,
      status: 200,
      code: "DUPLICATE",
      duplicate: true,
      webhookEventId: dup.id,
    };
  }

  let event;
  try {
    event = await prisma.mpWebhookEvent.create({
      data: {
        environment: env,
        eventType: normalized.parsed.rawType,
        panelTopic: normalized.panelKey,
        action: normalized.parsed.action,
        providerEventId: normalized.parsed.providerEventId,
        resourceType: normalized.resourceType,
        resourceId: normalized.parsed.resourceId,
        applicationId: normalized.parsed.applicationId,
        mpUserId: normalized.parsed.mpUserId,
        requestId: xRequestId,
        payloadHash,
        signatureValid: signature.valid || !secretConfigured,
        liveMode: normalized.parsed.liveMode,
        processingStatus: "VALIDATED",
        validatedAt: new Date(),
        sanitizedPayload: asJson(normalized.sanitizedPayload),
      },
    });
  } catch {
    // Unique race → duplicate
    const again = await findDuplicateMpWebhook({
      providerEventId: normalized.parsed.providerEventId,
      eventType: normalized.parsed.rawType,
      resourceId: normalized.parsed.resourceId,
      payloadHash,
    });
    if (again) {
      return {
        ok: true,
        status: 200,
        code: "DUPLICATE",
        duplicate: true,
        webhookEventId: again.id,
      };
    }
    return { ok: false, status: 500, code: "PERSIST_ERROR" };
  }

  // Também espelha no WebhookEvent legado (compat jobs antigos)
  const legacy = await prisma.webhookEvent
    .create({
      data: {
        provider: "mercado_pago",
        eventType: normalized.parsed.rawType,
        externalId: normalized.parsed.resourceId,
        payload: asJson(normalized.sanitizedPayload),
        payloadHash,
        idempotencyKey: `mp-new:${event.id}`,
        status: "PENDING",
        attemptCount: 1,
      },
    })
    .catch(() => null);

  if (legacy) {
    await prisma.mpWebhookEvent.update({
      where: { id: event.id },
      data: { legacyWebhookId: legacy.id },
    });
  }

  await prisma.mpWebhookEvent.update({
    where: { id: event.id },
    data: { processingStatus: "PROCESSING" },
  });

  const started = Date.now();
  const handler = getWebhookHandler(normalized.panelKey);

  try {
    const result = await handler({ event, normalized });
    const latencyMs = Date.now() - started;

    let processingStatus = result.processingStatus as MpWebhookProcessingStatus;
    let nextRetryAt: Date | null = null;
    let retryCount = event.retryCount;

    if (result.processingStatus === "RETRY_PENDING") {
      retryCount += 1;
      if (retryCount >= event.maxRetries) {
        processingStatus = "DEAD_LETTER";
      } else {
        nextRetryAt = new Date(Date.now() + Math.min(15 * 60_000 * retryCount, 6 * 3600_000));
        await enqueueJob({
          type: "PROCESS_MP_WEBHOOK_RETRY",
          payload: { mpWebhookEventId: event.id },
        }).catch(() => undefined);
      }
    }

    await prisma.mpWebhookAttempt.create({
      data: {
        webhookEventId: event.id,
        attemptNumber: retryCount + 1,
        status: processingStatus,
        failureCode: result.failureCode,
        failureReason: result.failureReason,
        latencyMs,
      },
    });

    await prisma.mpWebhookEvent.update({
      where: { id: event.id },
      data: {
        processingStatus,
        retryCount,
        nextRetryAt,
        failureCode: result.failureCode,
        failureReason: result.failureReason?.slice(0, 280),
        orderId: result.orderId ?? undefined,
        paymentId: result.paymentId ?? undefined,
        partnerId: result.partnerId ?? undefined,
        userId: result.userId ?? undefined,
        processedAt: new Date(),
      },
    });

    if (legacy) {
      await prisma.webhookEvent.update({
        where: { id: legacy.id },
        data: {
          status: processingStatus === "PROCESSED" || processingStatus === "NOT_APPLICABLE" || processingStatus === "UNSUPPORTED" || processingStatus === "IGNORED"
            ? "PROCESSED"
            : processingStatus === "DEAD_LETTER" || processingStatus === "FAILED"
              ? "FAILED"
              : "PENDING",
          processedAt: new Date(),
          errorMessage: result.failureReason,
        },
      });
    }

    if (processingStatus === "DEAD_LETTER") {
      await writeIntegrationLog({
        integrationName: "mercado_pago",
        provider: "mercado_pago",
        action: "webhook:dead_letter",
        status: "error",
        message: result.failureReason ?? "DEAD_LETTER",
        metadata: { mpWebhookEventId: event.id },
      }).catch(() => undefined);
    }

    return { ok: true, status: 200, code: processingStatus, webhookEventId: event.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 280) : "HANDLER_ERROR";
    await prisma.mpWebhookAttempt.create({
      data: {
        webhookEventId: event.id,
        attemptNumber: event.retryCount + 1,
        status: "FAILED",
        failureCode: "HANDLER_ERROR",
        failureReason: msg,
        latencyMs: Date.now() - started,
      },
    });
    await prisma.mpWebhookEvent.update({
      where: { id: event.id },
      data: {
        processingStatus: "FAILED",
        failureCode: "HANDLER_ERROR",
        failureReason: msg,
        processedAt: new Date(),
      },
    });
    // Ainda 200 para evitar storm — retry controlado via job
    return { ok: true, status: 200, code: "ACK_HANDLER_ERROR", webhookEventId: event.id };
  }
}

export async function reprocessMpWebhookEvent(mpWebhookEventId: string) {
  const event = await prisma.mpWebhookEvent.findUnique({ where: { id: mpWebhookEventId } });
  if (!event) throw new Error("NOT_FOUND");

  const raw = JSON.stringify(event.sanitizedPayload);
  const normalized = normalizeMercadoPagoWebhook(raw);
  if (!normalized) throw new Error("INVALID_STORED_PAYLOAD");

  // Restaura type original
  normalized.parsed.rawType = event.eventType;
  normalized.parsed.resourceId = event.resourceId;
  normalized.parsed.providerEventId = event.providerEventId;

  await prisma.mpWebhookEvent.update({
    where: { id: event.id },
    data: { processingStatus: "PROCESSING", retryCount: { increment: 1 } },
  });

  const handler = getWebhookHandler(
    (event.panelTopic as typeof normalized.panelKey) || normalized.panelKey
  );
  const result = await handler({ event, normalized });

  await prisma.mpWebhookEvent.update({
    where: { id: event.id },
    data: {
      processingStatus: result.processingStatus as MpWebhookProcessingStatus,
      failureCode: result.failureCode,
      failureReason: result.failureReason,
      orderId: result.orderId ?? undefined,
      paymentId: result.paymentId ?? undefined,
      processedAt: new Date(),
    },
  });

  return result;
}
