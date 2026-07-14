import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";

/**
 * Push requires VAPID keys + subscription store. Until wired end-to-end,
 * never report delivered: true.
 */
export class PushChannelProvider implements NotificationChannelProvider {
  readonly channel = "push" as const;

  async isConfigured() {
    return Boolean(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim()
    );
  }

  async send() {
    const configured = await this.isConfigured();
    if (!configured) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NOT_CONFIGURED: VAPID ausente — push não enviado",
      };
    }
    return {
      channel: this.channel,
      delivered: false,
      skipped: true,
      reason: "SKIPPED_NOT_CONFIGURED: canal push configurado parcialmente — envio Web Push ainda não ativado",
    };
  }
}
