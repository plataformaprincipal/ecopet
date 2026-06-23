import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";
import { InAppChannelProvider } from "@/lib/notifications/channels/in-app";
import { EmailChannelProvider } from "@/lib/notifications/channels/email";
import { SmsChannelProvider } from "@/lib/notifications/channels/sms";
import { WhatsappChannelProvider } from "@/lib/notifications/channels/whatsapp";
import { PushChannelProvider } from "@/lib/notifications/channels/push";

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
