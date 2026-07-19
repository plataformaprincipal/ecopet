import "server-only";

import type { MulticastMessage } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";
import { getFirebaseMessaging, isFirebaseAdminConfigured } from "./admin";
import {
  buildFcmPayload,
  mapNotificationTypeToCategory,
  toFcmDataRecord,
} from "./notification-builder";
import { canSendPushToUser } from "./preferences";
import {
  invalidatePushDevice,
  listActivePushDevices,
  revealDeviceToken,
} from "./token-management";
import { classifyFcmError, sanitizeErrorMessage } from "./errors";
import type { FcmNotificationPayload, PushCategory, SendPushSummary } from "./types";

const FCM_MULTICAST_LIMIT = 500;
const MAX_RETRY_ATTEMPTS = 3;

export type SendPushToUserInput = {
  userId: string;
  title: string;
  body: string;
  url?: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  notificationId?: string;
  category?: PushCategory;
  locale?: string;
  tag?: string;
  /** Chave idempotente por evento (evita push duplicado em retry/webhook). */
  idempotencyKey?: string;
  /** Enviar apenas a este pushDevice.id (teste admin). */
  onlyDeviceDbId?: string;
  skipPreferenceCheck?: boolean;
};

async function recordDelivery(params: {
  pushDeviceId: string;
  notificationId?: string;
  status: "SENT" | "FAILED" | "INVALID_TOKEN" | "SKIPPED" | "RETRY_PENDING";
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  idempotencyKey?: string | null;
  attemptCount?: number;
}) {
  const now = new Date();
  try {
    if (params.idempotencyKey) {
      const existing = await prisma.pushNotificationDelivery.findUnique({
        where: {
          idempotencyKey_pushDeviceId: {
            idempotencyKey: params.idempotencyKey,
            pushDeviceId: params.pushDeviceId,
          },
        },
      });
      if (existing) return existing;
    }

    return await prisma.pushNotificationDelivery.create({
      data: {
        pushDeviceId: params.pushDeviceId,
        notificationId: params.notificationId,
        status: params.status,
        providerMessageId: params.providerMessageId || undefined,
        errorCode: params.errorCode || undefined,
        errorMessage: params.errorMessage || undefined,
        idempotencyKey: params.idempotencyKey || undefined,
        attemptCount: params.attemptCount ?? 1,
        sentAt: params.status === "SENT" ? now : undefined,
        failedAt:
          params.status === "FAILED" || params.status === "INVALID_TOKEN" ? now : undefined,
      },
    });
  } catch {
    return null;
  }
}

async function markDeviceSuccess(deviceDbId: string) {
  await prisma.pushDevice.update({
    where: { id: deviceDbId },
    data: {
      lastSentAt: new Date(),
      lastSuccessAt: new Date(),
      failureCount: 0,
      lastSeenAt: new Date(),
    },
  });
}

async function markDeviceFailure(deviceDbId: string) {
  await prisma.pushDevice.update({
    where: { id: deviceDbId },
    data: {
      lastSentAt: new Date(),
      lastFailureAt: new Date(),
      failureCount: { increment: 1 },
    },
  });
}

/**
 * Envia push FCM a todos os dispositivos ativos do usuário.
 * Nunca falha a operação pai — retorna resumo sanitizado.
 */
export async function sendPushToUser(input: SendPushToUserInput): Promise<SendPushSummary> {
  const summary: SendPushSummary = {
    attempted: 0,
    sent: 0,
    failed: 0,
    invalidTokens: 0,
    skipped: 0,
    retryPending: 0,
  };

  if (!isFirebaseAdminConfigured()) {
    summary.skipped = 1;
    return summary;
  }

  const category =
    input.category || mapNotificationTypeToCategory(input.type);

  if (!input.skipPreferenceCheck) {
    const pref = await canSendPushToUser(input.userId, category);
    if (!pref.allowed) {
      summary.skipped = 1;
      return summary;
    }
  }

  let devices = await listActivePushDevices(input.userId);
  if (input.onlyDeviceDbId) {
    devices = devices.filter((d) => d.id === input.onlyDeviceDbId);
  }

  if (devices.length === 0) {
    summary.skipped = 1;
    return summary;
  }

  const payload = buildFcmPayload({
    title: input.title,
    body: input.body,
    url: input.url,
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    notificationId: input.notificationId,
    category,
    locale: input.locale,
    tag: input.tag,
  });

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    summary.skipped = 1;
    return summary;
  }

  for (const device of devices) {
    summary.attempted += 1;

    if (input.idempotencyKey) {
      const dup = await prisma.pushNotificationDelivery.findUnique({
        where: {
          idempotencyKey_pushDeviceId: {
            idempotencyKey: input.idempotencyKey,
            pushDeviceId: device.id,
          },
        },
      });
      if (dup) {
        summary.skipped += 1;
        continue;
      }
    }

    let token: string;
    try {
      token = revealDeviceToken(device.encryptedToken);
    } catch {
      summary.failed += 1;
      await invalidatePushDevice(device.id, "decrypt-failed");
      await recordDelivery({
        pushDeviceId: device.id,
        notificationId: input.notificationId,
        status: "INVALID_TOKEN",
        errorCode: "decrypt-failed",
        errorMessage: "Token storage invalid",
        idempotencyKey: input.idempotencyKey,
      });
      summary.invalidTokens += 1;
      continue;
    }

    try {
      // Data-only + webpush.notification — SW controla exibição (evita duplicata com onBackgroundMessage).
      const messageId = await messaging.send({
        token,
        data: toFcmDataRecord(payload),
        webpush: {
          fcmOptions: {
            link: payload.url,
          },
          headers: {
            Urgency: "high",
          },
        },
      });

      await markDeviceSuccess(device.id);
      await recordDelivery({
        pushDeviceId: device.id,
        notificationId: input.notificationId,
        status: "SENT",
        providerMessageId: messageId,
        idempotencyKey: input.idempotencyKey,
      });
      summary.sent += 1;
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "unknown";
      const classified = classifyFcmError(code);
      const msg = sanitizeErrorMessage(
        err instanceof Error ? err.message : "send_failed"
      );

      if (classified.permanent) {
        await invalidatePushDevice(device.id, classified.sanitizedCode);
        await recordDelivery({
          pushDeviceId: device.id,
          notificationId: input.notificationId,
          status: "INVALID_TOKEN",
          errorCode: classified.sanitizedCode,
          errorMessage: msg,
          idempotencyKey: input.idempotencyKey,
        });
        summary.invalidTokens += 1;
      } else if (classified.retryable) {
        await markDeviceFailure(device.id);
        await recordDelivery({
          pushDeviceId: device.id,
          notificationId: input.notificationId,
          status: "RETRY_PENDING",
          errorCode: classified.sanitizedCode,
          errorMessage: msg,
          idempotencyKey: input.idempotencyKey,
          attemptCount: 1,
        });
        summary.retryPending += 1;
      } else {
        await markDeviceFailure(device.id);
        await recordDelivery({
          pushDeviceId: device.id,
          notificationId: input.notificationId,
          status: "FAILED",
          errorCode: classified.sanitizedCode,
          errorMessage: msg,
          idempotencyKey: input.idempotencyKey,
        });
        summary.failed += 1;
      }
    }
  }

  return summary;
}

/**
 * Envio em lote com chunks do limite oficial do FCM (500).
 * Processa resultados por token e invalida tokens permanentes.
 */
export async function sendPushBatch(params: {
  tokens: Array<{ deviceDbId: string; token: string; userId: string }>;
  payload: FcmNotificationPayload;
  notificationId?: string;
  idempotencyKeyPrefix?: string;
}): Promise<SendPushSummary> {
  const summary: SendPushSummary = {
    attempted: 0,
    sent: 0,
    failed: 0,
    invalidTokens: 0,
    skipped: 0,
    retryPending: 0,
  };

  const messaging = getFirebaseMessaging();
  if (!messaging || params.tokens.length === 0) {
    summary.skipped = 1;
    return summary;
  }

  for (let i = 0; i < params.tokens.length; i += FCM_MULTICAST_LIMIT) {
    const chunk = params.tokens.slice(i, i + FCM_MULTICAST_LIMIT);
    summary.attempted += chunk.length;

    const message: MulticastMessage = {
      tokens: chunk.map((t) => t.token),
      data: toFcmDataRecord(params.payload),
      webpush: {
        fcmOptions: { link: params.payload.url },
        headers: { Urgency: "high" },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      response.responses.forEach((res, idx) => {
        const device = chunk[idx];
        if (!device) return;
        const idempotencyKey = params.idempotencyKeyPrefix
          ? `${params.idempotencyKeyPrefix}:${device.deviceDbId}`
          : undefined;

        if (res.success) {
          void markDeviceSuccess(device.deviceDbId);
          void recordDelivery({
            pushDeviceId: device.deviceDbId,
            notificationId: params.notificationId,
            status: "SENT",
            providerMessageId: res.messageId || null,
            idempotencyKey,
          });
          summary.sent += 1;
          return;
        }

        const code = res.error?.code;
        const classified = classifyFcmError(code);
        const msg = sanitizeErrorMessage(res.error?.message);

        if (classified.permanent) {
          void invalidatePushDevice(device.deviceDbId, classified.sanitizedCode);
          void recordDelivery({
            pushDeviceId: device.deviceDbId,
            notificationId: params.notificationId,
            status: "INVALID_TOKEN",
            errorCode: classified.sanitizedCode,
            errorMessage: msg,
            idempotencyKey,
          });
          summary.invalidTokens += 1;
        } else if (classified.retryable) {
          void markDeviceFailure(device.deviceDbId);
          void recordDelivery({
            pushDeviceId: device.deviceDbId,
            notificationId: params.notificationId,
            status: "RETRY_PENDING",
            errorCode: classified.sanitizedCode,
            errorMessage: msg,
            idempotencyKey,
          });
          summary.retryPending += 1;
        } else {
          void markDeviceFailure(device.deviceDbId);
          void recordDelivery({
            pushDeviceId: device.deviceDbId,
            notificationId: params.notificationId,
            status: "FAILED",
            errorCode: classified.sanitizedCode,
            errorMessage: msg,
            idempotencyKey,
          });
          summary.failed += 1;
        }
      });
    } catch (err) {
      summary.failed += chunk.length;
      void err;
    }
  }

  return summary;
}

export async function retryPendingDeliveries(limit = 50): Promise<SendPushSummary> {
  const pending = await prisma.pushNotificationDelivery.findMany({
    where: {
      status: "RETRY_PENDING",
      attemptCount: { lt: MAX_RETRY_ATTEMPTS },
    },
    take: limit,
    include: { pushDevice: true },
    orderBy: { createdAt: "asc" },
  });

  const summary: SendPushSummary = {
    attempted: 0,
    sent: 0,
    failed: 0,
    invalidTokens: 0,
    skipped: 0,
    retryPending: 0,
  };

  for (const row of pending) {
    if (!row.pushDevice.active) {
      await prisma.pushNotificationDelivery.update({
        where: { id: row.id },
        data: { status: "SKIPPED", errorMessage: "device_inactive" },
      });
      summary.skipped += 1;
      continue;
    }

    const result = await sendPushToUser({
      userId: row.pushDevice.userId,
      title: "EcoPet",
      body: "Atualização pendente",
      notificationId: row.notificationId || undefined,
      onlyDeviceDbId: row.pushDeviceId,
      skipPreferenceCheck: true,
      idempotencyKey: row.idempotencyKey
        ? `${row.idempotencyKey}:retry-${row.attemptCount + 1}`
        : `retry:${row.id}`,
    });

    summary.attempted += result.attempted;
    summary.sent += result.sent;
    summary.failed += result.failed;
    summary.invalidTokens += result.invalidTokens;

    await prisma.pushNotificationDelivery.update({
      where: { id: row.id },
      data: {
        attemptCount: { increment: 1 },
        status:
          result.sent > 0
            ? "SENT"
            : result.invalidTokens > 0
              ? "INVALID_TOKEN"
              : row.attemptCount + 1 >= MAX_RETRY_ATTEMPTS
                ? "FAILED"
                : "RETRY_PENDING",
      },
    });
  }

  return summary;
}

export { FCM_MULTICAST_LIMIT };
