import type { NotificationChannelProvider } from "@/lib/notifications/channels.types";
import { prisma } from "@/lib/prisma";
import { sendEmail, maskEmailForLog } from "@/lib/email/email-service";

/**
 * Delivery audit: outcomes recorded via NotificationDispatch / NotificationDispatchLog.
 */
export class EmailChannelProvider implements NotificationChannelProvider {
  readonly channel = "email" as const;

  async isConfigured() {
    return Boolean(process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim());
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
        reason: "SKIPPED_NOT_CONFIGURED: RESEND_API_KEY/SMTP ausente — e-mail não enviado",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true },
    });
    if (!user?.email) {
      return {
        channel: this.channel,
        delivered: false,
        skipped: true,
        reason: "SKIPPED_NO_DESTINATION",
      };
    }

    const action = params.actionUrl
      ? `<p><a href="${escapeHtml(params.actionUrl)}">Abrir no EcoPet</a></p>`
      : "";
    const html = `
      <div style="font-family:sans-serif;line-height:1.5">
        <h2>${escapeHtml(params.title)}</h2>
        <p>${escapeHtml(params.message)}</p>
        ${action}
        <p style="color:#666;font-size:12px">EcoPet — notificação automática</p>
      </div>
    `;

    const result = await sendEmail({
      to: user.email,
      subject: params.title,
      html,
      text: params.message,
      logPrefix: `[notify:email:${maskEmailForLog(user.email)}]`,
    });

    if (!result.sent) {
      const code = result.errorCode ?? "EMAIL_SEND_FAILED";
      if (code === "RESEND_NOT_CONFIGURED" || code === "EMAIL_NOT_CONFIGURED") {
        return {
          channel: this.channel,
          delivered: false,
          skipped: true,
          reason: `SKIPPED_NOT_CONFIGURED: ${code}`,
        };
      }
      return {
        channel: this.channel,
        delivered: false,
        reason: code,
      };
    }

    return { channel: this.channel, delivered: true };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
