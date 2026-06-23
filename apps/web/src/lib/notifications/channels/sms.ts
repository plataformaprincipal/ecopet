import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";

export class SmsChannelProvider implements NotificationChannelProvider {
  readonly channel = "sms" as const;

  async isConfigured() {
    return Boolean(process.env.TWILIO_ACCOUNT_SID || process.env.ZENVIA_API_TOKEN);
  }

  async send() {
    const configured = await this.isConfigured();
    if (!configured) {
      return { channel: this.channel, delivered: false, skipped: true, reason: "NOT_CONFIGURED" };
    }
    return { channel: this.channel, delivered: false, skipped: true, reason: "NOT_IMPLEMENTED" };
  }
}
