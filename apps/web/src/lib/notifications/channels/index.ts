import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";
import { InAppChannelProvider } from "@/lib/notifications/channels/in-app";
import { EmailChannelProvider } from "@/lib/notifications/channels/email";
import { SmsChannelProvider } from "@/lib/notifications/channels/sms";
import { WhatsappChannelProvider } from "@/lib/notifications/channels/whatsapp";
import { PushChannelProvider } from "@/lib/notifications/channels/push";

/**
 * Channel registry for NotificationDispatcher.
 * In-app always delivers when prefs allow.
 * Email/SMS deliver when credentials + destination exist; otherwise SKIPPED_NOT_CONFIGURED.
 * Push/WhatsApp remain skip-until-fully-wired (never fake success).
 */
const providers: NotificationChannelProvider[] = [
  new InAppChannelProvider(),
  new EmailChannelProvider(),
  new SmsChannelProvider(),
  new WhatsappChannelProvider(),
  new PushChannelProvider(),
];

export function getNotificationChannelProviders(): NotificationChannelProvider[] {
  return providers;
}

export function getChannelProvider(channel: string): NotificationChannelProvider | undefined {
  return providers.find((p) => p.channel === channel);
}
