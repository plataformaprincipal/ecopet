import { isResendConfigured as isResendConfiguredFromEmail } from "@/lib/email/config";

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
  return isResendConfiguredFromEmail(source);
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

export function isInstagramConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("INSTAGRAM_ACCESS_TOKEN", source) || env("META_APP_ID", source));
}

export function isFacebookConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env("FACEBOOK_APP_ID", source) && env("FACEBOOK_APP_SECRET", source)
  );
}

export function isTikTokConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("TIKTOK_CLIENT_KEY", source) && env("TIKTOK_CLIENT_SECRET", source));
}

export function isGoogleCalendarConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("GOOGLE_CALENDAR_CLIENT_ID", source) || env("GOOGLE_CLIENT_ID", source));
}

export function isGoogleDriveConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("GOOGLE_DRIVE_CLIENT_ID", source) || env("GOOGLE_CLIENT_ID", source));
}

export function isGoogleSheetsConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("GOOGLE_SHEETS_API_KEY", source) || env("GOOGLE_API_KEY", source));
}

export function isGoogleBusinessConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("GOOGLE_BUSINESS_PROFILE_ID", source) || env("GOOGLE_MY_BUSINESS_API_KEY", source));
}

export function isNotionConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("NOTION_API_KEY", source) || env("NOTION_TOKEN", source));
}

export function isTrelloConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("TRELLO_API_KEY", source) && env("TRELLO_TOKEN", source));
}

export function isSlackConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("SLACK_BOT_TOKEN", source) || env("SLACK_WEBHOOK_URL", source));
}

export function isZapierConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("ZAPIER_WEBHOOK_URL", source) || env("ZAPIER_HOOK_URL", source));
}

export function isN8nConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("N8N_WEBHOOK_URL", source) || env("N8N_API_KEY", source));
}

export function isCrmExternalConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("CRM_EXTERNAL_API_URL", source) || env("EXTERNAL_CRM_API_KEY", source));
}

export function isVetSystemConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("VET_SYSTEM_API_URL", source) || env("VETERINARY_SYSTEM_API_KEY", source));
}

export function isErpExternalConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("ERP_EXTERNAL_API_URL", source) || env("EXTERNAL_ERP_API_KEY", source));
}

export function isPdvExternalConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("PDV_EXTERNAL_API_URL", source) || env("EXTERNAL_PDV_API_KEY", source));
}

export function isInventorySystemConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("INVENTORY_SYSTEM_API_URL", source) || env("STOCK_SYSTEM_API_KEY", source));
}

export function isCustomWebhookConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("PARTNER_CUSTOM_WEBHOOK_URL", source) || env("WEBHOOK_SECRET", source));
}

export function isPixManualConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("PIX_MANUAL_KEY", source) || env("PIX_RECEIVER_KEY", source));
}

export function isCorreiosConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("CORREIOS_API_TOKEN", source) || env("CORREIOS_CONTRATO", source));
}

export function isMelhorEnvioConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("MELHOR_ENVIO_TOKEN", source));
}

export function isViaCepConfigured(): boolean {
  return true;
}

export function isVLibrasConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("VLIBRAS_WIDGET_URL", source) || env("VLIBRAS_ENABLED", source));
}

export function isGeminiConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("GOOGLE_API_KEY", source) || env("GEMINI_API_KEY", source));
}

export function isAnthropicConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env("ANTHROPIC_API_KEY", source));
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
  if (preferred) {
    const normalized = preferred.toLowerCase();
    if (normalized === "none" || normalized === "manual") return null;
  }
  if (preferred === "MERCADO_PAGO" && isMercadoPagoConfigured(source)) return "MERCADO_PAGO";
  if (preferred === "PAGARME" && isPagarmeConfigured(source)) return "PAGARME";
  if (preferred === "STRIPE" && isStripeConfigured(source)) return "STRIPE";
  // Also accept lowercase preferred values
  if (preferred?.toLowerCase() === "mercado_pago" && isMercadoPagoConfigured(source)) return "MERCADO_PAGO";
  if (preferred?.toLowerCase() === "pagarme" && isPagarmeConfigured(source)) return "PAGARME";
  if (preferred?.toLowerCase() === "stripe" && isStripeConfigured(source)) return "STRIPE";
  if (isMercadoPagoConfigured(source)) return "MERCADO_PAGO";
  if (isPagarmeConfigured(source)) return "PAGARME";
  if (isStripeConfigured(source)) return "STRIPE";
  return null;
}
