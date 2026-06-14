function env(key: string, source: NodeJS.ProcessEnv = process.env): string | undefined {
  const v = source[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function configuredEnvVars(keys: string[], source: NodeJS.ProcessEnv = process.env): string[] {
  return keys.filter((k) => Boolean(env(k, source)));
}

export function missingEnvVars(keys: string[], source: NodeJS.ProcessEnv = process.env): string[] {
  return keys.filter((k) => !env(k, source));
}

export function isProduction(source: NodeJS.ProcessEnv = process.env): boolean {
  return source.NODE_ENV === "production";
}

export function isCloudinaryConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env("CLOUDINARY_CLOUD_NAME", source) &&
      env("CLOUDINARY_API_KEY", source) &&
      env("CLOUDINARY_API_SECRET", source)
  );
}

export function isSupabaseStorageConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env("SUPABASE_URL", source) &&
      env("SUPABASE_SERVICE_ROLE_KEY", source) &&
      env("SUPABASE_STORAGE_BUCKET", source)
  );
}

export function isSmtpConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  const host = env("SMTP_HOST", source);
  const user = env("SMTP_USER", source);
  const pass = env("SMTP_PASS", source) ?? env("SMTP_PASSWORD", source);
  return Boolean(host && user && pass);
}

export function isResendConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("RESEND_API_KEY", source));
}

export function isEmailConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return isSmtpConfigured(source) || isResendConfigured(source);
}

export function isMercadoPagoConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("MERCADO_PAGO_ACCESS_TOKEN", source));
}

export function isPagarmeConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("PAGARME_API_KEY", source));
}

export function isStripeConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("STRIPE_SECRET_KEY", source) || env("STRIPE_PUBLISHABLE_KEY", source));
}

export function isOpenAiConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("OPENAI_API_KEY", source));
}

export function isGoogleMapsConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("GOOGLE_MAPS_API_KEY", source));
}

export function isMapboxConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("MAPBOX_ACCESS_TOKEN", source));
}

export function isWhatsAppConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env("WHATSAPP_API_TOKEN", source) && env("WHATSAPP_PHONE_NUMBER_ID", source)
  );
}

export function isShippingCarrierConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env("MELHOR_ENVIO_TOKEN", source) ||
      env("CORREIOS_API_TOKEN", source) ||
      env("CORREIOS_CONTRATO", source)
  );
}

export function isDevUploadFallbackEnabled(source: NodeJS.ProcessEnv = process.env): boolean {
  if (env("UPLOAD_DEV_FALLBACK", source) === "0") return false;
  if (env("UPLOAD_DEV_FALLBACK", source) === "1") return true;
  return !isProduction(source);
}

export function resolveActivePaymentProvider(source: NodeJS.ProcessEnv = process.env): string | null {
  const preferred = env("PAYMENT_PROVIDER", source);
  if (preferred === "MERCADO_PAGO" && isMercadoPagoConfigured(source)) return "MERCADO_PAGO";
  if (preferred === "PAGARME" && isPagarmeConfigured(source)) return "PAGARME";
  if (preferred === "STRIPE" && isStripeConfigured(source)) return "STRIPE";
  if (isMercadoPagoConfigured(source)) return "MERCADO_PAGO";
  if (isPagarmeConfigured(source)) return "PAGARME";
  if (isStripeConfigured(source)) return "STRIPE";
  return null;
}
