/**
 * Phase 1 — catálogo central de provedores externos.
 * Reexporta também o registry ERP/admin existente (listGlobalIntegrations).
 */

export type IntegrationProviderCategory =
  | "ai"
  | "email"
  | "sms"
  | "chat"
  | "media"
  | "payment"
  | "push"
  | "database";

export type IntegrationProviderDefinition = {
  id: string;
  name: string;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  category: IntegrationProviderCategory;
  capabilities: string[];
};

export const INTEGRATION_PROVIDER_REGISTRY: readonly IntegrationProviderDefinition[] = [
  {
    id: "openai",
    name: "OpenAI",
    requiredEnvVars: ["OPENAI_API_KEY"],
    optionalEnvVars: ["AI_ENABLED", "OPENAI_MODEL", "OPENAI_PAUSED"],
    category: "ai",
    capabilities: ["chat", "embeddings", "moderation", "recommendations"],
  },
  {
    id: "resend",
    name: "Resend",
    requiredEnvVars: ["RESEND_API_KEY"],
    optionalEnvVars: [
      "EMAIL_FROM",
      "EMAIL_FROM_NAME",
      "EMAIL_REPLY_TO",
      "EMAIL_SUPPORT",
      "EMAIL_DOMAIN_VERIFIED",
      "EMAIL_PROVIDER",
      "RESEND_FROM_EMAIL",
    ],
    category: "email",
    capabilities: ["transactional_email", "password_recovery", "admin_test_email"],
  },
  {
    id: "twilio",
    name: "Twilio",
    requiredEnvVars: ["SMS_PROVIDER", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    optionalEnvVars: ["SMS_SENDER"],
    category: "sms",
    capabilities: ["sms", "otp"],
  },
  {
    id: "talkjs",
    name: "TalkJS",
    requiredEnvVars: ["NEXT_PUBLIC_TALKJS_APP_ID", "TALKJS_SECRET_KEY"],
    optionalEnvVars: ["TALKJS_WEBHOOK_VERIFY"],
    category: "chat",
    capabilities: ["realtime_chat", "conversations"],
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    requiredEnvVars: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    optionalEnvVars: ["CLOUDINARY_FOLDER", "CLOUDINARY_UPLOAD_PRESET"],
    category: "media",
    capabilities: ["image_upload", "media_cdn"],
  },
  {
    id: "mercado_pago",
    name: "Mercado Pago",
    requiredEnvVars: ["MERCADO_PAGO_ACCESS_TOKEN", "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY"],
    optionalEnvVars: [
      "MERCADO_PAGO_PUBLIC_KEY",
      "MERCADO_PAGO_ENVIRONMENT",
      "MERCADO_PAGO_WEBHOOK_SECRET",
    ],
    category: "payment",
    capabilities: ["checkout_transparent", "api_orders", "pix", "card", "boleto", "webhooks"],
  },
  {
    id: "stripe",
    name: "Stripe",
    requiredEnvVars: ["STRIPE_SECRET_KEY"],
    optionalEnvVars: ["STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
    category: "payment",
    capabilities: ["checkout", "subscriptions", "webhooks"],
  },
  {
    id: "push",
    name: "Web Push (VAPID)",
    requiredEnvVars: ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
    optionalEnvVars: ["VAPID_SUBJECT"],
    category: "push",
    capabilities: ["web_push", "notifications"],
  },
  {
    id: "supabase",
    name: "Supabase / Database",
    requiredEnvVars: ["DATABASE_URL"],
    optionalEnvVars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"],
    category: "database",
    capabilities: ["postgres", "prisma"],
  },
] as const;

export function getIntegrationProviderDefinition(
  providerId: string
): IntegrationProviderDefinition | undefined {
  return INTEGRATION_PROVIDER_REGISTRY.find((p) => p.id === providerId);
}

export function listIntegrationProviderDefinitions(): IntegrationProviderDefinition[] {
  return [...INTEGRATION_PROVIDER_REGISTRY];
}
