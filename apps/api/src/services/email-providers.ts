/**
 * Provedores de e-mail ECOPET — estrutura preparada para homologação.
 *
 * Variáveis:
 * - EMAIL_PROVIDER: console | smtp | resend | sendgrid | ses
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * - RESEND_API_KEY, RESEND_FROM
 * - SENDGRID_API_KEY, SENDGRID_FROM
 * - AWS_SES_REGION, AWS_SES_ACCESS_KEY, AWS_SES_SECRET_KEY, AWS_SES_FROM
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

async function sendViaConsole(payload: EmailPayload, metadata?: Record<string, unknown>) {
  console.log("[ECOPET Email — console]", JSON.stringify({ ...payload, metadata }, null, 2));
  return { sent: true, provider: "console" as const, devPreview: payload.body };
}

async function sendViaSmtp(payload: EmailPayload) {
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error("SMTP_HOST não configurado");
  // Estrutura pronta — integração real na homologação de infraestrutura
  console.log("[ECOPET Email — smtp pending]", { host, to: payload.to, subject: payload.subject });
  return { sent: false, provider: "smtp" as const, pending: true };
}

async function sendViaResend(payload: EmailPayload) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não configurado");
  console.log("[ECOPET Email — resend pending]", { to: payload.to, subject: payload.subject });
  return { sent: false, provider: "resend" as const, pending: true };
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

  if (provider === "console") {
    return sendViaConsole(payload, metadata);
  }
  if (provider === "smtp") return sendViaSmtp(payload);
  if (provider === "resend") return sendViaResend(payload);
  if (provider === "sendgrid") return sendViaSendGrid(payload);
  return sendViaSes(payload);
}
