import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";
import { listActive } from "@/lib/push/push-service";
import { isPushConfigured } from "@/lib/push/vapid";
import { sendWebPush } from "@/lib/push/web-push-sender";
import { prisma } from "@/lib/prisma";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/firebase/messaging-server";
import { mapNotificationTypeToCategory } from "@/lib/firebase/notification-builder";

/**
 * Canal Push: FCM (preferencial quando configurado) + Web Push VAPID legado.
 * Nunca reporta delivered:true sem envio real.
 */
export class PushChannelProvider implements NotificationChannelProvider {
  readonly channel = "push" as const;

  async isConfigured() {
    return isFirebaseAdminConfigured() || isPushConfigured();
  }

  async send(params: {
    userId: string;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }) {
    const fcmReady = isFirebaseAdminConfigured();
    const vapidReady = isPushConfigured();

    if (!fcmReady && !vapidReady) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NOT_CONFIGURED: FCM/VAPID ausente — push não enviado",
      };
    }

    let anyDelivered = false;
    let lastFailure: string | undefined;
    let anyAttempt = false;

    if (fcmReady) {
      anyAttempt = true;
      const type =
        typeof params.metadata?.type === "string" ? params.metadata.type : undefined;
      const notificationId =
        typeof params.metadata?.notificationId === "string"
          ? params.metadata.notificationId
          : undefined;
      const idempotencyKey =
        typeof params.metadata?.idempotencyKey === "string"
          ? params.metadata.idempotencyKey
          : notificationId
            ? `notif:${notificationId}:fcm`
            : undefined;

      const summary = await sendPushToUser({
        userId: params.userId,
        title: params.title,
        body: params.message,
        url: params.actionUrl,
        type,
        notificationId,
        category: mapNotificationTypeToCategory(type),
        idempotencyKey,
        entityType:
          typeof params.metadata?.entityType === "string"
            ? params.metadata.entityType
            : undefined,
        entityId:
          typeof params.metadata?.entityId === "string"
            ? params.metadata.entityId
            : undefined,
      });

      if (summary.sent > 0) anyDelivered = true;
      else if (summary.skipped > 0 && summary.attempted === 0) {
        lastFailure = "SKIPPED_NO_FCM_DEVICE_OR_PREFERENCE";
      } else if (summary.failed + summary.invalidTokens > 0) {
        lastFailure = "FCM_SEND_PARTIAL_FAILURE";
      }
    }

    if (vapidReady) {
      const subscriptions = await listActive(params.userId);
      if (subscriptions.length > 0) {
        anyAttempt = true;
        for (const sub of subscriptions) {
          const outcome = await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            {
              title: params.title,
              body: params.message,
              url: params.actionUrl,
              data: params.metadata,
            }
          );

          if (outcome.code === "PUSH_GONE") {
            await prisma.pushSubscription.updateMany({
              where: { id: sub.id, revokedAt: null },
              data: { revokedAt: new Date() },
            });
          }

          if (outcome.delivered) {
            anyDelivered = true;
          } else if (!outcome.skipped) {
            lastFailure = outcome.reason ?? outcome.code;
          } else {
            lastFailure = outcome.reason ?? outcome.code;
          }
        }
      }
    }

    if (anyDelivered) {
      return { channel: this.channel, delivered: true };
    }

    if (!anyAttempt) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NO_DESTINATION",
      };
    }

    const reason = lastFailure ?? "PUSH_SEND_FAILED";
    if (reason.startsWith("SKIPPED_") || reason.startsWith("NOT_CONFIGURED")) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason,
      };
    }

    return {
      channel: this.channel,
      delivered: false,
      reason,
    };
  }
}
