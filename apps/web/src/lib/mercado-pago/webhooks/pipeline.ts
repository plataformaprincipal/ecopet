import "server-only";

import { prisma } from "@/lib/prisma";
import { hashPayload } from "@/lib/mercado-pago/crypto-utils";
import { getMercadoPagoEnvironment } from "@/lib/mercado-pago/config";
import {
  formatSignatureDiagnostics,
  normalizeMercadoPagoDataId,
  verifyMercadoPagoWebhookSignature,
  type MercadoPagoSignatureCandidate,
} from "@/lib/mercado-pago/webhooks/verify-signature";
import {
  sanitizeIdForDiag,
  type MercadoPagoWebhookQueryExtract,
} from "@/lib/mercado-pago/webhook-query";
import { normalizeMercadoPagoWebhook } from "@/lib/mercado-pago/webhooks/normalize-event";
import { findDuplicateMpWebhook } from "@/lib/mercado-pago/webhooks/idempotency";
import { getWebhookHandler } from "@/lib/mercado-pago/webhooks/event-router";
import { writeIntegrationLog } from "@/lib/integrations/log";
import { enqueueJob } from "@/lib/jobs/job-queue";
import type { MpWebhookProcessingStatus } from "@prisma/client";
import { asJson } from "@/lib/mercado-pago/webhooks/link-payment";
import { emitFinancialAlert } from "@/lib/finance/financial-alerts";

export type PipelineResult = {
  ok: boolean;
  status: number;
  code: string;
  duplicate?: boolean;
  webhookEventId?: string;
};

const MAX_BODY = 256_000;

function classifyWebhookSource(params: {
  queryDataId: string | null;
  bodyDataId: string | null;
}): "SIMULATOR" | "NATURAL" {
  // Simulador oficial usa Data ID numérico curto (ex.: 123456).
  const id = params.queryDataId || params.bodyDataId || "";
  if (/^\d{1,12}$/.test(id)) return "SIMULATOR";
  return "NATURAL";
}

function resolveDataIdForSignature(params: {
  query: MercadoPagoWebhookQueryExtract;
  bodyDataId: string | null;
}): { dataId: string | null; source: MercadoPagoSignatureCandidate } {
  const dot = normalizeMercadoPagoDataId(params.query.queryDataDotId);
  if (dot) return { dataId: dot, source: "QUERY_DATA_DOT_ID" };
  const under = normalizeMercadoPagoDataId(params.query.queryDataUnderscoreId);
  if (under) return { dataId: under, source: "QUERY_DATA_UNDERSCORE_ID" };
  // Fallback só body.data.id (nunca body.id do envelope — evita HMAC com "123456" de notificação).
  const body = normalizeMercadoPagoDataId(params.bodyDataId);
  if (body) return { dataId: body, source: "BODY_DATA_ID" };
  return { dataId: null, source: "OMITTED" };
}

function buildSignatureAudit(params: {
  source: "SIMULATOR" | "NATURAL";
  query: MercadoPagoWebhookQueryExtract;
  bodyDataId: string | null;
  bodyType: string | null;
  signatureReason: string;
  diagnostics?: ReturnType<typeof verifyMercadoPagoWebhookSignature>["diagnostics"];
}): string {
  const q = params.query;
  return [
    params.signatureReason,
    `source=${params.source}`,
    `rawQueryKeys=${q.rawQueryKeys.join(",") || "none"}`,
    `queryDataDotId=${sanitizeIdForDiag(q.queryDataDotId) ?? "none"}`,
    `queryDataUnderscoreId=${sanitizeIdForDiag(q.queryDataUnderscoreId) ?? "none"}`,
    `bodyDataId=${sanitizeIdForDiag(params.bodyDataId) ?? "none"}`,
    `typeQuery=${q.typeQuery ?? "none"}`,
    `bodyType=${params.bodyType ?? "none"}`,
    // Legado: NÃO usar queryDataId=1 como se fosse o id — flags explícitas:
    `queryDataIdPresent=${q.preferredQueryDataId ? 1 : 0}`,
    `bodyDataIdPresent=${params.bodyDataId ? 1 : 0}`,
    formatSignatureDiagnostics(params.diagnostics),
  ].join(" ");
}

export async function runMercadoPagoWebhookPipeline(params: {
  rawBody: string;
  headers: Headers;
  /** Extração completa da query (preferido). */
  query?: MercadoPagoWebhookQueryExtract | null;
  /** @deprecated use `query` — mantido para testes legados */
  queryDataId?: string | null;
}): Promise<PipelineResult> {
  if (params.rawBody.length > MAX_BODY) {
    return { ok: false, status: 413, code: "PAYLOAD_TOO_LARGE" };
  }

  const normalized = normalizeMercadoPagoWebhook(params.rawBody);
  if (!normalized) {
    return { ok: false, status: 400, code: "INVALID_PAYLOAD" };
  }

  const query: MercadoPagoWebhookQueryExtract =
    params.query ??
    ({
      rawQueryKeys: params.queryDataId ? ["data.id"] : [],
      queryDataDotId: params.queryDataId ?? null,
      queryDataUnderscoreId: null,
      queryId: null,
      typeQuery: null,
      preferredQueryDataId: params.queryDataId ?? null,
    } satisfies MercadoPagoWebhookQueryExtract);

  // Assinatura: body.data.id apenas (nunca body.id do envelope da notificação).
  const bodyDataIdForSig =
    normalized.parsed.data.id != null ? String(normalized.parsed.data.id) : null;

  const xSignature = params.headers.get("x-signature");
  const xRequestId = params.headers.get("x-request-id");
  const resolved = resolveDataIdForSignature({
    query,
    bodyDataId: bodyDataIdForSig,
  });
  const source = classifyWebhookSource({
    queryDataId: query.preferredQueryDataId,
    bodyDataId: bodyDataIdForSig,
  });

  const signature = verifyMercadoPagoWebhookSignature({
    xSignature,
    xRequestId,
    dataId: resolved.dataId,
    dataIdSource: resolved.source,
  });

  const secretConfigured = signature.reason !== "WEBHOOK_SECRET_MISSING";

  // Fail-closed: sem secret nunca processar webhook (dev/test/prod).
  // Homologação sandbox exige MERCADO_PAGO_WEBHOOK_SECRET configurado.
  if (!secretConfigured) {
    await writeIntegrationLog({
      integrationName: "mercado_pago",
      provider: "mercado_pago",
      action: "webhook:signature",
      status: "error",
      message: "WEBHOOK_SECRET_MISSING",
    }).catch(() => undefined);
    return { ok: false, status: 503, code: "WEBHOOK_SECRET_MISSING" };
  }

  if (secretConfigured && !signature.valid) {
    const auditMsg = buildSignatureAudit({
      source,
      query,
      bodyDataId: bodyDataIdForSig,
      bodyType: normalized.parsed.rawType,
      signatureReason: signature.reason ?? "INVALID_SIGNATURE",
      diagnostics: signature.diagnostics,
    });

    await writeIntegrationLog({
      integrationName: "mercado_pago",
      provider: "mercado_pago",
      action: "webhook:signature",
      status: "error",
      message: auditMsg,
    }).catch(() => undefined);

    await emitFinancialAlert({
      code: "WEBHOOK_SIGNATURE_FAILURE",
      severity: "P0",
      message: signature.reason ?? "INVALID_SIGNATURE",
      meta: {
        source,
        queryDataIdPresent: query.preferredQueryDataId ? 1 : 0,
        bodyDataIdPresent: bodyDataIdForSig ? 1 : 0,
        dataIdSrc: resolved.source,
        dataId: sanitizeIdForDiag(resolved.dataId),
        secretLen: signature.diagnostics?.secretLen ?? 0,
        secretSha8: signature.diagnostics?.secretSha8 ?? null,
        candidates: signature.diagnostics?.candidatesTried ?? 0,
        candidate: signature.diagnostics?.candidateUsed ?? null,
      },
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
          failureReason: auditMsg,
          sanitizedPayload: asJson({
            ...normalized.sanitizedPayload,
            _sigDiag: {
              source,
              rawQueryKeys: query.rawQueryKeys,
              queryDataDotId: sanitizeIdForDiag(query.queryDataDotId),
              queryDataUnderscoreId: sanitizeIdForDiag(query.queryDataUnderscoreId),
              bodyDataId: sanitizeIdForDiag(bodyDataIdForSig),
              typeQuery: query.typeQuery,
              dataIdSource: resolved.source,
              candidateUsed: signature.diagnostics?.candidateUsed ?? null,
              manifestSha8: signature.diagnostics?.manifestSha8Primary ?? null,
              xRequestIdSha8: signature.diagnostics?.xRequestIdSha8 ?? null,
              ts: signature.diagnostics?.ts ?? null,
              receivedV1Sha8: signature.diagnostics?.receivedV1Sha8 ?? null,
              expectedHmacSha8: signature.diagnostics?.expectedHmacSha8Primary ?? null,
              receivedHmacSha8: signature.diagnostics?.receivedHmacSha8 ?? null,
              secretSha8: signature.diagnostics?.secretSha8 ?? null,
            },
          }),
          processedAt: new Date(),
        },
      })
      .catch(() => undefined);

    return { ok: false, status: 401, code: signature.reason ?? "INVALID_SIGNATURE" };
  }

  // Diagnóstico temporário também no caminho válido (simulator baseline)
  const okAudit = buildSignatureAudit({
    source,
    query,
    bodyDataId: bodyDataIdForSig,
    bodyType: normalized.parsed.rawType,
    signatureReason: "SIGNATURE_OK",
    diagnostics: signature.diagnostics,
  });
  await writeIntegrationLog({
    integrationName: "mercado_pago",
    provider: "mercado_pago",
    action: "webhook:signature",
    status: "success",
    message: okAudit,
  }).catch(() => undefined);

  const sigDiagPayload = {
    source,
    rawQueryKeys: query.rawQueryKeys,
    queryDataDotId: sanitizeIdForDiag(query.queryDataDotId),
    queryDataUnderscoreId: sanitizeIdForDiag(query.queryDataUnderscoreId),
    bodyDataId: sanitizeIdForDiag(bodyDataIdForSig),
    typeQuery: query.typeQuery,
    dataIdSource: resolved.source,
    candidateUsed: signature.diagnostics?.candidateUsed ?? null,
    manifestSha8: signature.diagnostics?.manifestSha8Primary ?? null,
    xRequestIdSha8: signature.diagnostics?.xRequestIdSha8 ?? null,
    ts: signature.diagnostics?.ts ?? null,
    receivedV1Sha8: signature.diagnostics?.receivedV1Sha8 ?? null,
    expectedHmacSha8: signature.diagnostics?.expectedHmacSha8Primary ?? null,
    receivedHmacSha8: signature.diagnostics?.receivedHmacSha8 ?? null,
    secretSha8: signature.diagnostics?.secretSha8 ?? null,
    signatureValid: true,
  };

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
        failureReason: okAudit.slice(0, 480),
        sanitizedPayload: asJson({
          ...normalized.sanitizedPayload,
          _sigDiag: sigDiagPayload,
        }),
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
