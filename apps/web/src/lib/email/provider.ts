import { EmailStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail/sender";
import { isEmailConfigured, isResendConfigured, isSmtpConfigured } from "@/lib/integrations/env-check";
import { INTEGRATION_ERROR_CODES, IntegrationNotConfiguredError } from "@/lib/integrations/errors";
import { writeIntegrationLog } from "@/lib/integrations/log";
import type { TransactionalEmailEvent } from "@/lib/mail/transactional";

export type EmailSendResult = {
  sent: boolean;
  provider?: string;
  devOnly?: boolean;
  errorCode?: string;
};

async function logEmail(
  event: TransactionalEmailEvent,
  recipient: string,
  subject: string,
  status: EmailStatus,
  provider?: string,
  error?: string
) {
  try {
    await prisma.emailLog.create({
      data: {
        recipient,
        subject,
        event,
        status,
        provider,
        error,
        sentAt: status === EmailStatus.SENT ? new Date() : undefined,
      },
    });
  } catch {
    /* não quebrar fluxo */
  }
}

async function sendViaResend(payload: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
  const from = resolveEmailFrom();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text }),
  });
  return res.ok;
}

async function sendViaSendGrid(payload: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) return false;
  const from = resolveEmailFrom();
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: from },
      subject: payload.subject,
      content: [
        { type: "text/plain", value: payload.text },
        { type: "text/html", value: payload.html },
      ],
    }),
  });
  return res.ok;
}

async function sendViaBrevo(payload: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.BREVO_API_KEY?.trim();
  if (!key) return false;
  const from = resolveEmailFrom();
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: from, name: process.env.SMTP_FROM_NAME ?? "EcoPet" },
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });
  return res.ok;
}

function resolveEmailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "noreply@ecopet.local"
  );
}

export function assertEmailConfigured(requireDelivery = false): void {
  if (isEmailConfigured()) return;
  if (!requireDelivery && process.env.NODE_ENV !== "production") return;
  throw new IntegrationNotConfiguredError(
    INTEGRATION_ERROR_CODES.EMAIL_NOT_CONFIGURED,
    "E-mail não configurado. Configure SMTP ou Resend."
  );
}

export async function sendPlatformEmail(params: {
  event: TransactionalEmailEvent;
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Quando true, falha se não houver provedor (ex.: reset de senha) */
  requireDelivery?: boolean;
}): Promise<EmailSendResult> {
  const { event, to, subject, html, text, requireDelivery = false } = params;

  if (!isEmailConfigured()) {
    await writeIntegrationLog({
      integrationName: "email",
      provider: "none",
      action: event,
      status: "NOT_CONFIGURED",
      errorCode: INTEGRATION_ERROR_CODES.EMAIL_NOT_CONFIGURED,
      message: "Provedor de e-mail ausente.",
    });

    if (requireDelivery || process.env.NODE_ENV === "production") {
      await logEmail(event, to, subject, EmailStatus.FAILED, undefined, "EMAIL_NOT_CONFIGURED");
      if (requireDelivery) {
        throw new IntegrationNotConfiguredError(
          INTEGRATION_ERROR_CODES.EMAIL_NOT_CONFIGURED,
          "E-mail não configurado."
        );
      }
      return { sent: false, errorCode: INTEGRATION_ERROR_CODES.EMAIL_NOT_CONFIGURED };
    }

    console.warn(`[email:dev] ${event} → ${to}: ${subject} (não enviado — DEV_ONLY)`);
    await logEmail(event, to, subject, EmailStatus.FAILED, "dev_console", "DEV_ONLY: não enviado");
    return { sent: false, provider: "dev_console", devOnly: true, errorCode: "DEV_ONLY" };
  }

  try {
    if (isResendConfigured()) {
      const sent = await sendViaResend({ to, subject, html, text });
      if (sent) {
        await logEmail(event, to, subject, EmailStatus.SENT, "resend");
        await writeIntegrationLog({ integrationName: "resend", provider: "Resend", action: event, status: "OK" });
        return { sent: true, provider: "resend" };
      }
      await logEmail(event, to, subject, EmailStatus.FAILED, "resend", "Falha na API Resend");
    }

    if (process.env.SENDGRID_API_KEY?.trim()) {
      const sent = await sendViaSendGrid({ to, subject, html, text });
      if (sent) {
        await logEmail(event, to, subject, EmailStatus.SENT, "sendgrid");
        await writeIntegrationLog({ integrationName: "sendgrid", provider: "SendGrid", action: event, status: "OK" });
        return { sent: true, provider: "sendgrid" };
      }
    }

    if (process.env.BREVO_API_KEY?.trim()) {
      const sent = await sendViaBrevo({ to, subject, html, text });
      if (sent) {
        await logEmail(event, to, subject, EmailStatus.SENT, "brevo");
        await writeIntegrationLog({ integrationName: "brevo", provider: "Brevo", action: event, status: "OK" });
        return { sent: true, provider: "brevo" };
      }
    }

    if (isSmtpConfigured()) {
      await sendMail({ to, subject, html, text });
      await logEmail(event, to, subject, EmailStatus.SENT, "smtp");
      await writeIntegrationLog({ integrationName: "smtp", provider: "SMTP", action: event, status: "OK" });
      return { sent: true, provider: "smtp" };
    }

    await logEmail(event, to, subject, EmailStatus.FAILED, undefined, "Nenhum provedor disponível");
    return { sent: false, errorCode: "EMAIL_SEND_FAILED" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await logEmail(event, to, subject, EmailStatus.FAILED, undefined, msg);
    await writeIntegrationLog({
      integrationName: "email",
      provider: isResendConfigured() ? "Resend" : "SMTP",
      action: event,
      status: "FAILED",
      message: msg,
    });
    if (requireDelivery) throw error;
    return { sent: false, errorCode: "EMAIL_SEND_FAILED" };
  }
}
