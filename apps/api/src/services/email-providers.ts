/**
 * Provedores de e-mail ECOPET
 *
 * Variáveis:
 * - EMAIL_PROVIDER: console | smtp | resend | sendgrid | ses
 * - RESEND_API_KEY, EMAIL_FROM (ou RESEND_FROM)
 * - APP_URL — links de redefinição de senha
 */

export type EmailProvider = "console" | "smtp" | "resend" | "sendgrid" | "ses";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export function resolveEmailProvider(): EmailProvider {
  const configured = (process.env.EMAIL_PROVIDER ?? "").toLowerCase();
  if (configured === "smtp" || configured === "resend" || configured === "sendgrid" || configured === "ses") {
    return configured;
  }
  if (process.env.NODE_ENV === "production" && process.env.RESEND_API_KEY) return "resend";
  if (process.env.NODE_ENV === "production" && process.env.SENDGRID_API_KEY) return "sendgrid";
  if (process.env.NODE_ENV === "production" && process.env.SMTP_HOST) return "smtp";
  return "console";
}

function resolveFromAddress(): string {
  return (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    "EcoPet <noreply@ecopet.app>"
  );
}

async function sendViaConsole(payload: EmailPayload, metadata?: Record<string, unknown>) {
  console.log("[ECOPET Email — console]", JSON.stringify({ ...payload, metadata }, null, 2));
  return { sent: true, provider: "console" as const, devPreview: payload.body };
}

async function sendViaResend(payload: EmailPayload) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY não configurado");
  }

  const from = resolveFromAddress();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      text: payload.body,
      html: payload.html ?? payload.body.replace(/\n/g, "<br>"),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Falha ao enviar e-mail via Resend (${response.status}): ${detail}`);
  }

  return { sent: true, provider: "resend" as const };
}

async function sendViaSmtp(payload: EmailPayload) {
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error("SMTP_HOST não configurado");
  console.log("[ECOPET Email — smtp pending]", { host, to: payload.to, subject: payload.subject });
  return { sent: false, provider: "smtp" as const, pending: true };
}

async function sendViaSendGrid(payload: EmailPayload) {
  if (!process.env.SENDGRID_API_KEY) throw new Error("SENDGRID_API_KEY não configurado");
  console.log("[ECOPET Email — sendgrid pending]", { to: payload.to, subject: payload.subject });
  return { sent: false, provider: "sendgrid" as const, pending: true };
}

async function sendViaSes(payload: EmailPayload) {
  if (!process.env.AWS_SES_REGION) throw new Error("AWS_SES_REGION não configurado");
  console.log("[ECOPET Email — ses pending]", { to: payload.to, subject: payload.subject });
  return { sent: false, provider: "ses" as const, pending: true };
}

export async function dispatchEmail(payload: EmailPayload, metadata?: Record<string, unknown>) {
  const provider = resolveEmailProvider();

  if (process.env.NODE_ENV === "production" && provider === "console") {
    throw new Error(
      "Envio de e-mail em produção requer RESEND_API_KEY (ou EMAIL_PROVIDER=smtp|sendgrid|ses)"
    );
  }

  if (provider === "console") {
    return sendViaConsole(payload, metadata);
  }
  if (provider === "resend") return sendViaResend(payload);
  if (provider === "smtp") return sendViaSmtp(payload);
  if (provider === "sendgrid") return sendViaSendGrid(payload);
  return sendViaSes(payload);
}
