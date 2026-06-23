import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";

/** In-app: persistido via notification-service (este provider é no-op de envio externo). */
export class InAppChannelProvider implements NotificationChannelProvider {
  readonly channel = "inApp" as const;

  async isConfigured() {
    return true;
  }

  async send() {
    return { channel: this.channel, delivered: true };
  }
}
