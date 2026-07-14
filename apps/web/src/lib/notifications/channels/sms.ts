import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";
import { prisma } from "@/lib/prisma";
import { isSmsConfigured } from "@/lib/sms/provider";
import { isTwilioConfigured, sendTwilioSms } from "@/lib/sms/twilio";

/**
 * Delivery audit: use NotificationDispatch status strings.
 * Generic notification SMS only when Twilio is fully configured; never fake success.
 */
export class SmsChannelProvider implements NotificationChannelProvider {
  readonly channel = "sms" as const;

  async isConfigured() {
    return isSmsConfigured() || isTwilioConfigured();
  }

  async send(params: {
    userId: string;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }) {
    const configured = await this.isConfigured();
    if (!configured) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NOT_CONFIGURED: TWILIO ausente — SMS não enviado",
      };
    }

    if (!isTwilioConfigured()) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NOT_CONFIGURED: provedor SMS genérico ainda não disponível para notificações",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { phone: true },
    });
    if (!user?.phone) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NO_DESTINATION",
      };
    }

    const body = `EcoPet: ${params.title} — ${params.message}`.slice(0, 320);
    const result = await sendTwilioSms({
      to: user.phone,
      body,
      logPrefix: "[notify:sms]",
    });

    if (!result.sent) {
      const code = result.errorCode ?? "SMS_SEND_FAILED";
      if (code === "SMS_NOT_CONFIGURED" || code === "TWILIO_NOT_CONFIGURED") {
        return {
          channel: this.channel,
          delivered: false,
          skipped: true,
          reason: `SKIPPED_NOT_CONFIGURED: ${code}`,
        };
      }
      return { channel: this.channel, delivered: false, reason: code };
    }

    return { channel: this.channel, delivered: true };
  }
}
