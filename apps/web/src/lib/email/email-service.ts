import { Resend } from "resend";
import {
  getResendApiKey,
  getResendFromAddress,
  type ResendSendResult,
} from "@/lib/email/resend";

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  logPrefix?: string;
};

export function maskEmailForLog(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***${domain}`;
}

function maskRecipientsForLog(to: string | string[]): string {
  const list = Array.isArray(to) ? to : [to];
  return list.map(maskEmailForLog).join(", ");
}

function logDev(prefix: string, message: string, detail?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  if (detail === undefined) {
    console.log(`${prefix} ${message}`);
    return;
  }
  console.log(`${prefix} ${message}`, typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
}

function logDevError(prefix: string, message: string, detail?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.error(`${prefix} ${message}`, typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
}

/**
 * Serviço centralizado de e-mail via Resend.
 * Usa `new Resend(process.env.RESEND_API_KEY)` — nunca hardcode a chave.
 */
export async function sendEmail(params: SendEmailParams): Promise<ResendSendResult> {
  const prefix = params.logPrefix ?? "[email]";
  const from = params.from ?? getResendFromAddress();
  const keyLoaded = Boolean(getResendApiKey());

  logDev(prefix, "RESEND_API_KEY carregada:", keyLoaded);
  logDev(prefix, "EMAIL_FROM:", from);
  logDev(prefix, "Enviando para:", maskRecipientsForLog(params.to));

  if (!keyLoaded) {
    const err = {
      message:
        "RESEND_API_KEY ausente. Defina RESEND_API_KEY em apps/web/.env com sua chave do Resend.",
    };
    logDevError(prefix, "Resend error:", err);
    return { sent: false, errorCode: "RESEND_NOT_CONFIGURED", error: err };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const response = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  logDev(prefix, "Resend data:", response.data ?? null);
  logDev(prefix, "Resend error:", response.error ?? null);
  if (response.data?.id) {
    logDev(prefix, "E-mail id:", response.data.id);
  }

  if (response.error) {
    return {
      sent: false,
      errorCode: (response.error as { name?: string }).name || "RESEND_SEND_FAILED",
      error: response.error,
      data: response.data,
    };
  }

  return { sent: true, id: response.data?.id, data: response.data };
}
