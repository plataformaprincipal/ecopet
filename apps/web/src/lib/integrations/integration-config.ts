/**
 * Leitura segura de env para o registry de integrações (Phase 1).
 * Nunca loga valores de secret — apenas presença / máscara.
 */

const PLACEHOLDER_RE =
  /^(change-?me|changeme|placeholder|your[_-]?|replace[_-]?me|xxx+|todo|fixing|sk-xxx|pk_test_xxx|test[_-]?key)$/i;

export type EnvSource = NodeJS.ProcessEnv;

export function readEnv(key: string, source: EnvSource = process.env): string | undefined {
  const raw = source[key];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function hasEnv(key: string, source: EnvSource = process.env): boolean {
  return Boolean(readEnv(key, source));
}

/** Detecta valores óbvios de placeholder (não valida formato real de chave). */
export function isPlaceholderValue(value: string | undefined | null): boolean {
  if (!value) return true;
  const v = value.trim();
  if (!v) return true;
  if (PLACEHOLDER_RE.test(v)) return true;
  if (/^(your_|replace_|change.?me|xxx)/i.test(v)) return true;
  return false;
}

export function hasRealEnv(key: string, source: EnvSource = process.env): boolean {
  const value = readEnv(key, source);
  return Boolean(value && !isPlaceholderValue(value));
}

export function missingEnvKeys(keys: string[], source: EnvSource = process.env): string[] {
  return keys.filter((key) => !hasRealEnv(key, source));
}

export function presentEnvKeys(keys: string[], source: EnvSource = process.env): string[] {
  return keys.filter((key) => hasRealEnv(key, source));
}

/** Máscara pública — nunca revela o secret. */
export function maskEnvPresence(key: string, source: EnvSource = process.env): "set" | "missing" | "placeholder" {
  const value = readEnv(key, source);
  if (!value) return "missing";
  if (isPlaceholderValue(value)) return "placeholder";
  return "set";
}

export function isAiGloballyEnabled(source: EnvSource = process.env): boolean {
  return source.AI_ENABLED !== "false" && source.OPENAI_PAUSED !== "1";
}

export function isOpenAiEnvConfigured(source: EnvSource = process.env): boolean {
  return isAiGloballyEnabled(source) && hasRealEnv("OPENAI_API_KEY", source);
}

export function isResendEnvConfigured(source: EnvSource = process.env): boolean {
  return hasRealEnv("RESEND_API_KEY", source);
}

export function isTwilioEnvConfigured(source: EnvSource = process.env): boolean {
  if (readEnv("SMS_PROVIDER", source)?.toLowerCase() !== "twilio") return false;
  return (
    hasRealEnv("TWILIO_ACCOUNT_SID", source) &&
    hasRealEnv("TWILIO_AUTH_TOKEN", source) &&
    hasRealEnv("TWILIO_PHONE_NUMBER", source)
  );
}

export function isTalkjsEnvConfigured(source: EnvSource = process.env): boolean {
  return hasRealEnv("NEXT_PUBLIC_TALKJS_APP_ID", source) && hasRealEnv("TALKJS_SECRET_KEY", source);
}

export function isCloudinaryEnvConfigured(source: EnvSource = process.env): boolean {
  return (
    hasRealEnv("CLOUDINARY_CLOUD_NAME", source) &&
    hasRealEnv("CLOUDINARY_API_KEY", source) &&
    hasRealEnv("CLOUDINARY_API_SECRET", source)
  );
}

export function isMercadoPagoEnvConfigured(source: EnvSource = process.env): boolean {
  return hasRealEnv("MERCADO_PAGO_ACCESS_TOKEN", source);
}

export function isStripeEnvConfigured(source: EnvSource = process.env): boolean {
  return hasRealEnv("STRIPE_SECRET_KEY", source);
}

export function isPushEnvConfigured(source: EnvSource = process.env): boolean {
  return hasRealEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", source) && hasRealEnv("VAPID_PRIVATE_KEY", source);
}

export function isSupabaseEnvConfigured(source: EnvSource = process.env): boolean {
  return hasRealEnv("DATABASE_URL", source);
}

export function isTurnstileEnvConfigured(source: EnvSource = process.env): boolean {
  // Catálogo client-safe: só Site Key. Secret é verificada no diagnóstico server-only.
  return hasRealEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", source);
}

export type ProviderConfiguredChecker = (source?: EnvSource) => boolean;

export const PROVIDER_CONFIGURED_CHECKERS: Record<string, ProviderConfiguredChecker> = {
  openai: isOpenAiEnvConfigured,
  resend: isResendEnvConfigured,
  twilio: isTwilioEnvConfigured,
  talkjs: isTalkjsEnvConfigured,
  cloudinary: isCloudinaryEnvConfigured,
  mercado_pago: isMercadoPagoEnvConfigured,
  stripe: isStripeEnvConfigured,
  push: isPushEnvConfigured,
  supabase: isSupabaseEnvConfigured,
  turnstile: isTurnstileEnvConfigured,
};
