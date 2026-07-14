import { writeIntegrationLog } from "@/lib/integrations/log";
import {
  isTwilioConfigured,
  maskPhoneForLog,
  sendTwilioRecoveryOtp,
} from "@/lib/sms/twilio";

export type SmsProviderName = "twilio" | "zenvia" | "infobip" | "console";

export type SmsSendResult = {
  sent: boolean;
  provider?: SmsProviderName;
  devOnly?: boolean;
  errorCode?: string;
  messageSid?: string;
};

function env(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function resolveSmsProvider(): SmsProviderName | null {
  const explicit = env("SMS_PROVIDER")?.toLowerCase();
  if (explicit === "twilio") {
    return isTwilioConfigured() ? "twilio" : null;
  }
  if (explicit === "zenvia" || explicit === "infobip") {
    return explicit;
  }
  if (env("SMS_API_KEY") && explicit) {
    return explicit as SmsProviderName;
  }
  if (isTwilioConfigured()) return "twilio";
  if (env("ZENVIA_API_TOKEN")) return "zenvia";
  if (env("INFOBIP_API_KEY")) return "infobip";
  return null;
}

export function isSmsConfigured(): boolean {
  return resolveSmsProvider() !== null;
}

function smsSender(): string {
  return env("SMS_SENDER") ?? "EcoPet";
}

async function sendViaZenvia(to: string, body: string): Promise<boolean> {
  const apiToken = env("ZENVIA_API_TOKEN") ?? env("SMS_API_KEY");
  if (!apiToken) return false;
  const from = smsSender();
  const res = await fetch("https://api.zenvia.com/v2/channels/sms/messages", {
    method: "POST",
    headers: {
      "X-API-TOKEN": apiToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      contents: [{ type: "text", text: body }],
    }),
  });
  return res.ok;
}

async function sendViaInfobip(to: string, body: string): Promise<boolean> {
  const apiKey = env("INFOBIP_API_KEY") ?? env("SMS_API_KEY");
  const baseUrl = env("INFOBIP_BASE_URL") ?? "https://api.infobip.com";
  if (!apiKey) return false;
  const from = smsSender();
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/sms/2/text/advanced`, {
    method: "POST",
    headers: {
      Authorization: `App ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ from, destinations: [{ to }], text: body }],
    }),
  });
  return res.ok;
}

export async function sendPasswordResetSms(to: string, code: string): Promise<SmsSendResult> {
  const provider = resolveSmsProvider();

  if (!provider) {
    if (process.env.NODE_ENV !== "production" || process.env.AUTH_TEST_EXPOSE_OTP === "1") {
      console.info(`[sms:dev] SMS não configurado — destino ${maskPhoneForLog(to)}`);
      return { sent: false, provider: "console", devOnly: true, errorCode: "SMS_NOT_CONFIGURED" };
    }
    await writeIntegrationLog({
      integrationName: "sms",
      provider: "none",
      action: "PASSWORD_RESET_OTP",
      status: "NOT_CONFIGURED",
      message: "SMS não configurado.",
    });
    return { sent: false, errorCode: "SMS_NOT_CONFIGURED" };
  }

  if (provider === "twilio") {
    const result = await sendTwilioRecoveryOtp(to, code, "[forgot-password:sms]");
    await writeIntegrationLog({
      integrationName: "sms",
      provider: "twilio",
      action: "PASSWORD_RESET_OTP",
      status: result.sent ? "OK" : "FAILED",
      errorCode: result.errorCode,
      message: result.sent ? (result.sid ? `sid:${result.sid}` : undefined) : String(result.errorCode ?? "FAILED"),
    });
    if (result.sent) {
      return { sent: true, provider: "twilio", messageSid: result.sid };
    }
    return { sent: false, provider: "twilio", errorCode: result.errorCode ?? "SMS_SEND_FAILED" };
  }

  const body = `Seu código EcoPet é: ${code}. Ele expira em 10 minutos.`;

  try {
    let ok = false;
    if (provider === "zenvia") ok = await sendViaZenvia(to, body);
    else if (provider === "infobip") ok = await sendViaInfobip(to, body);

    await writeIntegrationLog({
      integrationName: "sms",
      provider,
      action: "PASSWORD_RESET_OTP",
      status: ok ? "OK" : "FAILED",
    });

    if (ok) return { sent: true, provider };
    return { sent: false, provider, errorCode: "SMS_SEND_FAILED" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await writeIntegrationLog({
      integrationName: "sms",
      provider,
      action: "PASSWORD_RESET_OTP",
      status: "FAILED",
      message: msg,
    });
    return { sent: false, provider, errorCode: "SMS_SEND_FAILED" };
  }
}
