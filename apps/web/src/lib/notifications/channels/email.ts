import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";

export class EmailChannelProvider implements NotificationChannelProvider {
  readonly channel = "email" as const;

  async isConfigured() {
    return Boolean(process.env.RESEND_API_KEY);
  }

  async send() {
    const configured = await this.isConfigured();
    if (!configured) {
      return { channel: this.channel, delivered: false, skipped: true, reason: "NOT_CONFIGURED" };
    }
    // Resend dispatch reservado para integração futura unificada
    return { channel: this.channel, delivered: false, skipped: true, reason: "NOT_IMPLEMENTED" };
  }
}
