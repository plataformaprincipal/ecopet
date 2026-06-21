import Twilio from "twilio";

export type TwilioSendResult = {
  sent: boolean;
  sid?: string;
  errorCode?: string;
  error?: unknown;
};

function env(key: string): string | undefined {
  const value = process.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getTwilioAccountSid(): string | undefined {
  return env("TWILIO_ACCOUNT_SID");
}

export function getTwilioAuthToken(): string | undefined {
  return env("TWILIO_AUTH_TOKEN");
}

export function getTwilioPhoneNumber(): string | undefined {
  return env("TWILIO_PHONE_NUMBER");
}

/** Twilio configurado quando SMS_PROVIDER=twilio e credenciais presentes. */
export function isTwilioConfigured(): boolean {
  if (env("SMS_PROVIDER")?.toLowerCase() !== "twilio") return false;
  return Boolean(getTwilioAccountSid() && getTwilioAuthToken() && getTwilioPhoneNumber());
}

export function maskPhoneForLog(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "***";
  return `***${digits.slice(-4)}`;
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

export function formatRecoveryOtpSmsBody(code: string): string {
  return `Seu código EcoPet é: ${code}. Ele expira em 10 minutos.`;
}

/**
 * Envio SMS via SDK Twilio — credenciais apenas em variáveis de ambiente.
 * Nunca loga TWILIO_AUTH_TOKEN.
 */
export async function sendTwilioSms(params: {
  to: string;
  body: string;
  logPrefix?: string;
}): Promise<TwilioSendResult> {
  const prefix = params.logPrefix ?? "[twilio]";
  const accountSid = getTwilioAccountSid();
  const authToken = getTwilioAuthToken();
  const from = getTwilioPhoneNumber();

  logDev(prefix, "TWILIO_ACCOUNT_SID carregado:", Boolean(accountSid));
  logDev(prefix, "TWILIO_AUTH_TOKEN carregado:", Boolean(authToken));
  logDev(prefix, "TWILIO_PHONE_NUMBER:", from ?? "(ausente)");
  logDev(prefix, "Enviando SMS para:", maskPhoneForLog(params.to));

  if (!accountSid || !authToken || !from) {
    const err = {
      message:
        "Twilio não configurado. Defina SMS_PROVIDER=twilio, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_PHONE_NUMBER em apps/web/.env",
    };
    logDevError(prefix, "Twilio error:", err);
    return { sent: false, errorCode: "TWILIO_NOT_CONFIGURED", error: err };
  }

  try {
    const client = Twilio(accountSid, authToken);
    const message = await client.messages.create({
      to: params.to,
      from,
      body: params.body,
    });

    logDev(prefix, "Twilio SID:", message.sid ?? null);
    if (message.errorCode) {
      logDevError(prefix, "Twilio error:", { code: message.errorCode, message: message.errorMessage });
      return {
        sent: false,
        errorCode: String(message.errorCode),
        error: { message: message.errorMessage },
        sid: message.sid,
      };
    }

    return { sent: true, sid: message.sid };
  } catch (error) {
    const err = error as { code?: number; message?: string; status?: number };
    logDevError(prefix, "Twilio error:", {
      code: err.code,
      message: err.message,
      status: err.status,
    });
    return {
      sent: false,
      errorCode: err.code ? String(err.code) : "TWILIO_SEND_FAILED",
      error: { message: err.message ?? "Falha ao enviar SMS" },
    };
  }
}

export async function sendTwilioRecoveryOtp(
  to: string,
  code: string,
  logPrefix?: string
): Promise<TwilioSendResult> {
  return sendTwilioSms({
    to,
    body: formatRecoveryOtpSmsBody(code),
    logPrefix: logPrefix ?? "[forgot-password:sms]",
  });
}
