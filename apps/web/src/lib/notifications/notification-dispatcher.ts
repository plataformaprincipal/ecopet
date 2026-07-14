import { prisma } from "@/lib/prisma";
import { createNotification, getOrCreatePreferences } from "@/lib/notifications/notification-service";
import { getNotificationChannelProviders } from "@/lib/notifications/channels";
import type { ChannelDispatchResult, NotificationChannel } from "@/lib/notifications/channels.types";
import {
  normalizeNotificationType,
  typeToPreferenceKey,
  type CreateNotificationInput,
} from "@/lib/notifications/type-mapper";
import type { NotificationType } from "@prisma/client";

export type DispatchChannels = Partial<Record<NotificationChannel, boolean>>;

export type DispatchNotificationInput = CreateNotificationInput & {
  /** Default: inApp true; email/sms/push/whatsapp follow prefs + config */
  channels?: DispatchChannels;
};

export type DispatchNotificationResult = {
  notificationId: string | null;
  channels: ChannelDispatchResult[];
};

async function channelAllowedByPrefs(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<boolean> {
  const prefs = await getOrCreatePreferences(userId);
  if (type === "SECURITY") return true;

  if (channel === "inApp") return Boolean(prefs.inAppEnabled);
  if (channel === "email") return Boolean(prefs.emailEnabled);
  if (channel === "sms") return Boolean(prefs.smsEnabled);
  // No dedicated pushEnabled column yet — treat as opt-in via emailEnabled-like marketing off by default
  if (channel === "push") return Boolean(prefs.emailEnabled);
  if (channel === "whatsapp") return Boolean(prefs.whatsappEnabled);
  return false;
}

/**
 * Multichannel dispatcher.
 * - inApp is fully implemented via Notification rows.
 * - Other channels: real send when configured and wired; otherwise SKIPPED_NOT_CONFIGURED.
 * - Never fails the primary operation if an outbound channel skips/fails.
 * - Audit via NotificationDispatch + NotificationDispatchLog (no separate NotificationDelivery model).
 */
export async function dispatchNotification(
  input: DispatchNotificationInput
): Promise<DispatchNotificationResult> {
  const type = normalizeNotificationType(input.type);
  const want: DispatchChannels = {
    inApp: true,
    email: true,
    sms: false,
    push: true,
    whatsapp: false,
    ...input.channels,
  };

  const results: ChannelDispatchResult[] = [];
  let notificationId: string | null = null;

  if (want.inApp !== false) {
    try {
      const row = await createNotification(input);
      notificationId = row?.id ?? null;
      results.push({
        channel: "inApp",
        delivered: Boolean(row),
        skipped: !row,
        reason: row ? undefined : "SKIPPED_PREFERENCE_OR_FILTER",
      });
    } catch (err) {
      results.push({
        channel: "inApp",
        delivered: false,
        reason: err instanceof Error ? err.message.slice(0, 200) : "IN_APP_FAILED",
      });
    }
  }

  const providers = getNotificationChannelProviders().filter((p) => p.channel !== "inApp");

  for (const provider of providers) {
    if (want[provider.channel] === false) continue;

    const allowed = await channelAllowedByPrefs(input.userId, type, provider.channel);
    if (!allowed) {
      results.push({
        channel: provider.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_PREFERENCE",
      });
      continue;
    }

    try {
      const outcome = await provider.send({
        userId: input.userId,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        metadata: input.metadata as Record<string, unknown> | undefined,
      });
      results.push(outcome);
    } catch (err) {
      results.push({
        channel: provider.channel,
        delivered: false,
        reason: err instanceof Error ? err.message.slice(0, 200) : "CHANNEL_FAILED",
      });
    }
  }

  // Best-effort audit (never throw to callers)
  try {
    const dispatch = await prisma.notificationDispatch.create({
      data: {
        title: input.title.slice(0, 200),
        body: input.message.slice(0, 2000),
        channel: "multi",
        status: results.every((r) => r.delivered || r.skipped) ? "COMPLETED" : "PARTIAL",
        recipientCount: 1,
        sentAt: new Date(),
        logs: {
          create: results.map((r) => ({
            userId: input.userId,
            status: r.delivered
              ? "DELIVERED"
              : r.skipped
                ? r.reason?.startsWith("SKIPPED_NOT_CONFIGURED")
                  ? "SKIPPED_NOT_CONFIGURED"
                  : "SKIPPED"
                : "FAILED",
            metadata: {
              channel: r.channel,
              reason: r.reason ?? null,
              notificationId,
              preferenceKey: typeToPreferenceKey(type),
            },
          })),
        },
      },
    });
    void dispatch;
  } catch {
    // Audit must not break product flows
  }

  return { notificationId, channels: results };
}

/** Alias used by product code expecting NotificationDispatcher API */
export const NotificationDispatcher = {
  dispatch: dispatchNotification,
};
