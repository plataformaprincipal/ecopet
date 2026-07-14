import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";

/**
 * WhatsApp Business API not wired. Never fake success.
 */
export class WhatsappChannelProvider implements NotificationChannelProvider {
  readonly channel = "whatsapp" as const;

  async isConfigured() {
    return Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
  }

  async send() {
    const configured = await this.isConfigured();
    if (!configured) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NOT_CONFIGURED: WhatsApp ausente — mensagem não enviada",
      };
    }
    return {
      channel: this.channel,
      delivered: false,
      skipped: true,
      reason: "SKIPPED_NOT_CONFIGURED: canal WhatsApp ainda não integrado ao dispatcher",
    };
  }
}
