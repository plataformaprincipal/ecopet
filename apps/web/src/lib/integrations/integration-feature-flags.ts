import {
  isAiGloballyEnabled,
  isCloudinaryEnvConfigured,
  isMercadoPagoEnvConfigured,
  isOpenAiEnvConfigured,
  isPushEnvConfigured,
  isResendEnvConfigured,
  isStripeEnvConfigured,
  isTalkjsEnvConfigured,
  isTwilioEnvConfigured,
  readEnv,
  type EnvSource,
} from "@/lib/integrations/integration-config";
import { isEmailConfigured, isSmtpConfigured } from "@/lib/integrations/env-check";

/** Feature flags baseadas em env (Phase 1 — sem live calls). */

export function isAiEnabled(source: EnvSource = process.env): boolean {
  return isAiGloballyEnabled(source) && isOpenAiEnvConfigured(source);
}

export function isEmailEnabled(source: EnvSource = process.env): boolean {
  return isResendEnvConfigured(source) || isSmtpConfigured(source) || isEmailConfigured(source);
}

export function isSmsEnabled(source: EnvSource = process.env): boolean {
  return isTwilioEnvConfigured(source);
}

export function isChatEnabled(source: EnvSource = process.env): boolean {
  return isTalkjsEnvConfigured(source);
}

export function isMediaUploadEnabled(source: EnvSource = process.env): boolean {
  return isCloudinaryEnvConfigured(source);
}

export function isMercadoPagoEnabled(source: EnvSource = process.env): boolean {
  return isMercadoPagoEnvConfigured(source);
}

export function isStripeEnabled(source: EnvSource = process.env): boolean {
  return isStripeEnvConfigured(source);
}

export function isPaymentsEnabled(source: EnvSource = process.env): boolean {
  return isMercadoPagoEnabled(source) || isStripeEnabled(source);
}

export function isPushEnabled(source: EnvSource = process.env): boolean {
  return isPushEnvConfigured(source);
}

export function isDatabaseConfigured(source: EnvSource = process.env): boolean {
  return Boolean(readEnv("DATABASE_URL", source));
}

export function getIntegrationFeatureFlags(source: EnvSource = process.env) {
  return {
    ai: isAiEnabled(source),
    email: isEmailEnabled(source),
    sms: isSmsEnabled(source),
    chat: isChatEnabled(source),
    mediaUpload: isMediaUploadEnabled(source),
    payments: isPaymentsEnabled(source),
    mercadoPago: isMercadoPagoEnabled(source),
    stripe: isStripeEnabled(source),
    push: isPushEnabled(source),
    database: isDatabaseConfigured(source),
  } as const;
}
