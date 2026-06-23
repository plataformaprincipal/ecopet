import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";

export class PushChannelProvider implements NotificationChannelProvider {
  readonly channel = "push" as const;

  async isConfigured() {
    return Boolean(process.env.FIREBASE_PROJECT_ID || process.env.VAPID_PUBLIC_KEY);
  }

  async send() {
    const configured = await this.isConfigured();
    if (!configured) {
      return { channel: this.channel, delivered: false, skipped: true, reason: "NOT_CONFIGURED" };
    }
    return { channel: this.channel, delivered: false, skipped: true, reason: "NOT_IMPLEMENTED" };
  }
}
