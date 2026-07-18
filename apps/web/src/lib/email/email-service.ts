import {
  getEmailFromAddress,
  getEmailReplyTo,
  getResendApiKey,
} from "@/lib/email/config";
import {
  mapResendError,
  publicEmailError,
  sanitizeEmailErrorMessage,
  type EmailErrorCode,
} from "@/lib/email/errors";
import { getResendClient } from "@/lib/email/resend";
import {
  clearResendOperationalError,
  recordResendOperationalError,
} from "@/lib/email/resend-status";

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type SendEmailParams = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  /** Metadados internos (não enviados ao Resend se não suportados). */
  metadata?: Record<string, string>;
  logPrefix?: string;
};

export type SendEmailResult = {
  sent: boolean;
  id?: string;
  data?: unknown;
  error?: { message: string };
  errorCode?: EmailErrorCode | string;
  retryable?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function normalizeList(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  const list = (Array.isArray(value) ? value : [value])
    .map((v) => v.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

function assertValidRecipients(list: string[]): EmailErrorCode | null {
  for (const email of list) {
    if (!EMAIL_RE.test(email) || email.includes("\n") || email.includes("\r")) {
      return "EMAIL_INVALID_RECIPIENT";
    }
  }
  return null;
}

/** Remove CR/LF de assunto e headers (anti header-injection). */
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 500);
}

function logDev(prefix: string, message: string, detail?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  if (detail === undefined) {
    console.log(`${prefix} ${message}`);
    return;
  }
  console.log(
    `${prefix} ${message}`,
    typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)
  );
}

function logStructured(level: "info" | "error", payload: Record<string, unknown>) {
  const safe = { ...payload };
  delete safe.apiKey;
  delete safe.key;
  delete safe.authorization;
  const line = JSON.stringify({ scope: "email", level, ...safe });
  if (level === "error") console.error(line);
  else if (process.env.NODE_ENV !== "production") console.log(line);
}

/**
 * Serviço centralizado de e-mail via Resend.
 * Usa exclusivamente process.env.RESEND_API_KEY — nunca hardcode.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const prefix = params.logPrefix ?? "[email]";
  const from = sanitizeHeaderValue(params.from ?? getEmailFromAddress());
  const subject = sanitizeHeaderValue(params.subject);
  const toList = normalizeList(params.to) ?? [];
  const cc = normalizeList(params.cc);
  const bcc = normalizeList(params.bcc);
  const replyTo =
    normalizeList(params.replyTo) ?? normalizeList(getEmailReplyTo() ? [getEmailReplyTo()!] : undefined);
  const keyLoaded = Boolean(getResendApiKey());

  logDev(prefix, "RESEND_API_KEY carregada:", keyLoaded);
  logDev(prefix, "EMAIL_FROM:", from);
  logDev(prefix, "Enviando para:", maskRecipientsForLog(toList));

  if (!keyLoaded) {
    const err = publicEmailError("RESEND_NOT_CONFIGURED");
    logStructured("error", { event: "send_skip", code: err.code, to: maskRecipientsForLog(toList) });
    return { sent: false, errorCode: err.code, error: { message: err.message }, retryable: false };
  }

  if (toList.length === 0) {
    const err = publicEmailError("EMAIL_INVALID_RECIPIENT");
    return { sent: false, errorCode: err.code, error: { message: err.message }, retryable: false };
  }

  const invalid =
    assertValidRecipients(toList) ||
    (cc ? assertValidRecipients(cc) : null) ||
    (bcc ? assertValidRecipients(bcc) : null);
  if (invalid) {
    const err = publicEmailError(invalid);
    return { sent: false, errorCode: err.code, error: { message: err.message }, retryable: false };
  }

  const client = getResendClient();
  if (!client) {
    const err = publicEmailError("RESEND_NOT_CONFIGURED");
    return { sent: false, errorCode: err.code, error: { message: err.message }, retryable: false };
  }

  try {
    const response = await client.emails.send({
      from,
      to: toList,
      ...(cc ? { cc } : {}),
      ...(bcc ? { bcc } : {}),
      ...(replyTo?.length ? { replyTo: replyTo.length === 1 ? replyTo[0] : replyTo } : {}),
      subject,
      html: params.html,
      text: params.text,
      ...(params.headers
        ? {
            headers: Object.fromEntries(
              Object.entries(params.headers).map(([k, v]) => [sanitizeHeaderValue(k), sanitizeHeaderValue(v)])
            ),
          }
        : {}),
      ...(params.tags?.length ? { tags: params.tags } : {}),
      ...(params.attachments?.length
        ? {
            attachments: params.attachments.map((a) => ({
              filename: sanitizeHeaderValue(a.filename),
              content: typeof a.content === "string" ? a.content : a.content.toString("base64"),
              ...(a.contentType ? { contentType: a.contentType } : {}),
            })),
          }
        : {}),
    });

    logDev(prefix, "Resend data:", response.data ?? null);
    logDev(prefix, "Resend error:", response.error ?? null);

    if (response.error) {
      const mapped = mapResendError({
        statusCode: (response.error as { statusCode?: number }).statusCode,
        name: (response.error as { name?: string }).name,
        message: sanitizeEmailErrorMessage((response.error as { message?: string }).message),
      });
      recordResendOperationalError(mapped.message);
      logStructured("error", {
        event: "send_failed",
        code: mapped.code,
        to: maskRecipientsForLog(toList),
        subject,
      });
      return {
        sent: false,
        errorCode: mapped.code,
        error: { message: mapped.message },
        retryable: mapped.retryable,
        data: response.data,
      };
    }

    clearResendOperationalError();
    logStructured("info", {
      event: "send_ok",
      id: response.data?.id,
      to: maskRecipientsForLog(toList),
      subject,
      tags: params.tags?.map((t) => t.name),
      metadataKeys: params.metadata ? Object.keys(params.metadata) : undefined,
    });
    if (response.data?.id) {
      logDev(prefix, "E-mail id:", response.data.id);
    }

    return { sent: true, id: response.data?.id, data: response.data };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const mapped = mapResendError({ message: sanitizeEmailErrorMessage(rawMessage) });
    recordResendOperationalError(mapped.message);
    logStructured("error", {
      event: "send_exception",
      code: mapped.code,
      to: maskRecipientsForLog(toList),
    });
    return {
      sent: false,
      errorCode: mapped.code,
      error: { message: mapped.message },
      retryable: mapped.retryable,
    };
  }
}

/** Alias compatível com sendViaResendSdk legado. */
export async function sendViaResendSdk(payload: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  logPrefix?: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    from: payload.from,
    logPrefix: payload.logPrefix ?? "[resend]",
  });
}
