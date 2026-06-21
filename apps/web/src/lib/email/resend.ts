import { Resend } from "resend";
import { sendEmail } from "@/lib/email/email-service";

export const RESEND_DEFAULT_FROM = "onboarding@resend.dev";

export function getResendApiKey(source: NodeJS.ProcessEnv = process.env): string | undefined {
  return source.RESEND_API_KEY?.trim() || undefined;
}

export function getResendFromAddress(source: NodeJS.ProcessEnv = process.env): string {
  return source.EMAIL_FROM?.trim() || RESEND_DEFAULT_FROM;
}

export function isResendReady(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getResendApiKey(source));
}

export type ResendSendPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  logPrefix?: string;
};

export type ResendSendResult = {
  sent: boolean;
  id?: string;
  data?: unknown;
  error?: unknown;
  errorCode?: string;
};

/** @deprecated Prefer `sendEmail` from `@/lib/email/email-service`. */
export function createResendClient(source: NodeJS.ProcessEnv = process.env): Resend | null {
  const apiKey = getResendApiKey(source);
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/** Envia via serviço centralizado — `new Resend(process.env.RESEND_API_KEY)`. */
export async function sendViaResendSdk(payload: ResendSendPayload): Promise<ResendSendResult> {
  return sendEmail({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    from: payload.from,
    logPrefix: payload.logPrefix ?? "[resend]",
  });
}
