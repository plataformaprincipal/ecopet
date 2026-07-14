import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";
import { listActive } from "@/lib/push/push-service";
import { isPushConfigured } from "@/lib/push/vapid";
import { sendWebPush } from "@/lib/push/web-push-sender";
import { prisma } from "@/lib/prisma";

/**
 * Web Push channel. Never reports delivered:true without a real send.
 */
export class PushChannelProvider implements NotificationChannelProvider {
  readonly channel = "push" as const;

  async isConfigured() {
    return isPushConfigured();
  }

  async send(params: {
    userId: string;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }) {
    if (!isPushConfigured()) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NOT_CONFIGURED: VAPID ausente — push não enviado",
      };
    }

    const subscriptions = await listActive(params.userId);
    if (subscriptions.length === 0) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NO_DESTINATION",
      };
    }

    let anyDelivered = false;
    let lastFailure: string | undefined;

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

    if (anyDelivered) {
      return { channel: this.channel, delivered: true };
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
