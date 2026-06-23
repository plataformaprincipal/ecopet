import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";

export class WhatsappChannelProvider implements NotificationChannelProvider {
  readonly channel = "whatsapp" as const;

  async isConfigured() {
    return Boolean(process.env.WHATSAPP_BUSINESS_TOKEN);
  }

  async send() {
    const configured = await this.isConfigured();
    if (!configured) {
      return { channel: this.channel, delivered: false, skipped: true, reason: "NOT_CONFIGURED" };
    }
    return { channel: this.channel, delivered: false, skipped: true, reason: "NOT_IMPLEMENTED" };
  }
}
