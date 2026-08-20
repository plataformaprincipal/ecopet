/**
 * Gate operacional de lançamento — classificação honesta por evidência de código/env.
 * Nunca declara WORKING só porque o SDK está instalado.
 * Live provider checks ficam no admin / smoke; este módulo é configuration + policy.
 */

import {
  isGoogleAuthEnvConfigured,
  isMercadoPagoEnvConfigured,
  isOpenAiEnvConfigured,
  isResendEnvConfigured,
  isSupabaseEnvConfigured,
  isTalkjsEnvConfigured,
  isTwilioEnvConfigured,
} from "@/lib/integrations/integration-config";
import { evaluateSplitCapability } from "@/lib/finance/split-capability";
import {
  GOOGLE_PRODUCTION_ORIGIN,
  googleCallbackPath,
} from "@/lib/auth/google-oauth";

export type LaunchClass = "LAUNCH_REQUIRED" | "LAUNCH_OPTIONAL" | "FEATURE_FLAGGED" | "FUTURE_ONLY" | "REMOVED";

export type LaunchHealthVerdict =
  | "READY"
  | "EXTERNAL_ACTION_REQUIRED"
  | "EXTERNAL_CONFIG_REQUIRED"
  | "READY_PAYMENT"
  | "SPLIT_REQUIRES_MP_ENABLEMENT"
  | "OPTIONAL"
  | "MISSING_ENV"
  | "FEATURE_FLAGGED"
  | "DISABLED"
  | "REMOVED";

export type LaunchHealthRow = {
  provider: string;
  launchClass: LaunchClass;
  verdict: LaunchHealthVerdict;
  configured: boolean;
  note: string;
};

export function googleCloudConfigurationRequired() {
  return {
    authorizedJavascriptOrigins: [GOOGLE_PRODUCTION_ORIGIN, "http://localhost:3000"],
    authorizedRedirectUris: [
      `${GOOGLE_PRODUCTION_ORIGIN}${googleCallbackPath()}`,
      `http://localhost:3000${googleCallbackPath()}`,
    ],
  };
}

export function getLaunchHealthRows(source: NodeJS.ProcessEnv = process.env): LaunchHealthRow[] {
  const googleConfigured = isGoogleAuthEnvConfigured(source);
  const openaiConfigured = isOpenAiEnvConfigured(source);
  const resendConfigured = isResendEnvConfigured(source);
  const twilioConfigured = isTwilioEnvConfigured(source);
  const talkjsConfigured = isTalkjsEnvConfigured(source);
  const mpConfigured = isMercadoPagoEnvConfigured(source);
  const supabaseConfigured = isSupabaseEnvConfigured(source);
  const split = evaluateSplitCapability(source);

  return [
    {
      provider: "GOOGLE_AUTH",
      launchClass: "LAUNCH_REQUIRED",
      configured: googleConfigured,
      verdict: googleConfigured ? "EXTERNAL_CONFIG_REQUIRED" : "MISSING_ENV",
      note: googleConfigured
        ? "Código pronto. Redirect URI precisa existir no Google Cloud."
        : "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET ausentes neste ambiente.",
    },
    {
      provider: "OPENAI",
      launchClass: "LAUNCH_REQUIRED",
      configured: openaiConfigured,
      verdict: openaiConfigured ? "READY" : "MISSING_ENV",
      note: "Project header só é enviado com OPENAI_SEND_PROJECT=1.",
    },
    {
      provider: "RESEND",
      launchClass: "LAUNCH_REQUIRED",
      configured: resendConfigured,
      verdict: resendConfigured ? "READY" : "MISSING_ENV",
      note: "E-mail transacional. Falha de envio não reverte pagamento.",
    },
    {
      provider: "TWILIO",
      launchClass: "LAUNCH_OPTIONAL",
      configured: twilioConfigured,
      verdict: twilioConfigured ? "OPTIONAL" : "MISSING_ENV",
      note: "SMS/OTP de recuperação. Não bloqueia Google nem cadastro por e-mail.",
    },
    {
      provider: "TALKJS",
      launchClass: "LAUNCH_REQUIRED",
      configured: talkjsConfigured,
      verdict: talkjsConfigured ? "READY" : "MISSING_ENV",
      note: "Mensagens sociais 1:1. Sem credencial: UI operacional indisponível, sem chat falso.",
    },
    {
      provider: "MERCADO_PAGO",
      launchClass: "LAUNCH_REQUIRED",
      configured: mpConfigured,
      verdict: mpConfigured ? "READY_PAYMENT" : "MISSING_ENV",
      note: "Checkout 1:1. Split continua SPLIT_REQUIRES_MP_ENABLEMENT.",
    },
    {
      provider: "MERCADO_PAGO_SPLIT",
      launchClass: "LAUNCH_REQUIRED",
      configured: split.splitReady,
      verdict: "SPLIT_REQUIRES_MP_ENABLEMENT",
      note: "splitReady permanece false até evidência PSP.",
    },
    {
      provider: "SUPABASE_DB",
      launchClass: "LAUNCH_REQUIRED",
      configured: supabaseConfigured,
      verdict: supabaseConfigured ? "READY" : "MISSING_ENV",
      note: "PostgreSQL via Prisma. Auth EccoPet não usa Supabase Auth.",
    },
    {
      provider: "FACEBOOK_AUTH",
      launchClass: "REMOVED",
      configured: false,
      verdict: "REMOVED",
      note: "Login Facebook removido. Campo social ONG/parceiro permanece.",
    },
    {
      provider: "APPLE_AUTH",
      launchClass: "REMOVED",
      configured: false,
      verdict: "REMOVED",
      note: "Login Apple removido.",
    },
  ];
}
