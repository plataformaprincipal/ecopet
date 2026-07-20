import type { IntegrationDefinition } from "@/lib/integrations/types";
import {
  configuredEnvVars,
  isCloudinaryConfigured,
  isDevUploadFallbackEnabled,
  isEmailConfigured,
  isGoogleAnalyticsConfigured,
  isGoogleTagManagerConfigured,
  isGoogleMapsConfigured,
  isMapboxConfigured,
  isMercadoPagoConfigured,
  isOpenAiConfigured,
  isPagarmeConfigured,
  isProduction,
  isResendConfigured,
  isShippingCarrierConfigured,
  isSmtpConfigured,
  isStripeConfigured,
  isSupabaseStorageConfigured,
  isWhatsAppConfigured,
  resolveActivePaymentProvider,
} from "@/lib/integrations/env-check";

export const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
  {
    name: "vlibras",
    provider: "VLibras",
    category: "accessibility",
    requiredEnvVars: [],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: () => "ACTIVE",
    resolveMessage: () => "Widget VLibras (gov.br) disponível — integração confirmada, sem credenciais.",
    recommendedAction: "Nenhuma ação necessária.",
  },
  {
    name: "upload_local_dev",
    provider: "Local Dev",
    category: "upload",
    requiredEnvVars: [],
    canRunInProduction: false,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isDevUploadFallbackEnabled(env) ? "DEV_ONLY" : "DISABLED"),
    resolveMessage: (env = process.env) =>
      isDevUploadFallbackEnabled(env)
        ? "Fallback local ativo apenas em desenvolvimento."
        : "Fallback local desativado (UPLOAD_DEV_FALLBACK=0 ou produção).",
    recommendedAction: "Em produção, configure Cloudinary ou Supabase Storage.",
  },
  {
    name: "cloudinary",
    provider: "Cloudinary",
    category: "upload",
    requiredEnvVars: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isCloudinaryConfigured(env) ? "ACTIVE" : "NOT_CONFIGURED"),
    resolveMessage: (env = process.env) =>
      isCloudinaryConfigured(env)
        ? "Cloudinary configurado para upload em produção."
        : "Credenciais Cloudinary ausentes.",
    recommendedAction: "Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.",
  },
  {
    name: "supabase_storage",
    provider: "Supabase Storage",
    category: "storage",
    requiredEnvVars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isSupabaseStorageConfigured(env) ? "PARTIAL" : "NOT_CONFIGURED"),
    resolveMessage: (env = process.env) =>
      isSupabaseStorageConfigured(env)
        ? "Credenciais presentes — implementação de upload pendente."
        : "Supabase Storage não configurado.",
    recommendedAction: "Configure variáveis Supabase ou use Cloudinary.",
  },
  {
    name: "smtp",
    provider: "SMTP",
    category: "email",
    requiredEnvVars: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isSmtpConfigured(env) ? "ACTIVE" : "NOT_CONFIGURED"),
    resolveMessage: (env = process.env) =>
      isSmtpConfigured(env) ? "SMTP configurado." : "SMTP não configurado.",
    recommendedAction: "Configure SMTP_HOST, SMTP_USER e SMTP_PASS.",
  },
  {
    name: "resend",
    provider: "Resend",
    category: "email",
    requiredEnvVars: ["RESEND_API_KEY"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isResendConfigured(env) ? "ACTIVE" : "NOT_CONFIGURED"),
    resolveMessage: (env = process.env) =>
      isResendConfigured(env) ? "Resend configurado." : "RESEND_API_KEY ausente.",
    recommendedAction: "Defina RESEND_API_KEY para envio via Resend.",
  },
  {
    name: "email",
    provider: "E-mail transacional",
    category: "email",
    requiredEnvVars: ["SMTP_HOST/SMTP_USER/SMTP_PASS ou RESEND_API_KEY"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => {
      if (isEmailConfigured(env)) return "ACTIVE";
      if (!isProduction(env)) return "DEV_ONLY";
      return "NOT_CONFIGURED";
    },
    resolveMessage: (env = process.env) => {
      if (isEmailConfigured(env)) return "Provedor de e-mail configurado.";
      if (!isProduction(env)) return "Sem provedor — apenas log DEV em desenvolvimento.";
      return "Nenhum provedor de e-mail configurado em produção.";
    },
    recommendedAction: "Configure SMTP ou Resend antes de ir para produção.",
  },
  {
    name: "mercado_pago",
    provider: "Mercado Pago",
    category: "payment",
    requiredEnvVars: ["MERCADO_PAGO_ACCESS_TOKEN", "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => {
      if (!isMercadoPagoConfigured(env)) return "NOT_CONFIGURED";
      const pk =
        env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim() || env.MERCADO_PAGO_PUBLIC_KEY?.trim();
      if (!pk) return "PARTIAL";
      if (!env.MERCADO_PAGO_WEBHOOK_SECRET?.trim()) return "PARTIAL";
      return "ACTIVE";
    },
    resolveMessage: (env = process.env) => {
      if (!isMercadoPagoConfigured(env)) return "Mercado Pago não configurado.";
      const pk =
        env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim() || env.MERCADO_PAGO_PUBLIC_KEY?.trim();
      if (!pk) return "Access Token OK — Public Key ausente (checkout transparente incompleto).";
      if (!env.MERCADO_PAGO_WEBHOOK_SECRET?.trim()) {
        return "TEST/API Orders pronto — webhook secret pendente de cadastro.";
      }
      return "Mercado Pago Checkout Transparente (API Orders) configurado.";
    },
    recommendedAction:
      "Configure MERCADO_PAGO_* + NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY; cadastre webhook em produção.",
  },
  {
    name: "pagarme",
    provider: "Pagar.me",
    category: "payment",
    requiredEnvVars: ["PAGARME_API_KEY"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isPagarmeConfigured(env) ? "PARTIAL" : "NOT_CONFIGURED"),
    resolveMessage: () => "Gateway Pagar.me não implementado.",
    recommendedAction: "Defina PAGARME_API_KEY quando implementar Etapa 9B.",
  },
  {
    name: "stripe",
    provider: "Stripe",
    category: "payment",
    requiredEnvVars: ["STRIPE_SECRET_KEY"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isStripeConfigured(env) ? "PARTIAL" : "NOT_CONFIGURED"),
    resolveMessage: () => "Gateway Stripe não implementado.",
    recommendedAction: "Defina STRIPE_SECRET_KEY quando implementar Etapa 9B.",
  },
  {
    name: "payment_gateway",
    provider: "Pagamentos",
    category: "payment",
    requiredEnvVars: ["PAYMENT_PROVIDER + credenciais do provedor"],
    canRunInProduction: true,
    canRunInDevelopment: false,
    resolveStatus: (env = process.env) => (resolveActivePaymentProvider(env) ? "PARTIAL" : "NOT_CONFIGURED"),
    resolveMessage: (env = process.env) => {
      const p = resolveActivePaymentProvider(env);
      return p
        ? `Provedor ${p} com credenciais — checkout de pagamento pendente.`
        : "Nenhum gateway de pagamento configurado.";
    },
    recommendedAction: "Configure PAYMENT_PROVIDER e credenciais do provedor escolhido.",
  },
  {
    name: "openai",
    provider: "OpenAI",
    category: "ai",
    requiredEnvVars: ["OPENAI_API_KEY"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isOpenAiConfigured(env) ? "PARTIAL" : "NOT_CONFIGURED"),
    resolveMessage: (env = process.env) =>
      isOpenAiConfigured(env)
        ? "Chave presente — fluxos de IA preparados, sem resposta simulada."
        : "OPENAI_API_KEY ausente.",
    recommendedAction: "Defina OPENAI_API_KEY para habilitar IA.",
  },
  {
    name: "brasilapi_cnpj",
    provider: "BrasilAPI",
    category: "maps",
    requiredEnvVars: [],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: () => "ACTIVE",
    resolveMessage: () => "Consulta de CNPJ via BrasilAPI (API pública, sem chave).",
    recommendedAction: "Nenhuma ação necessária.",
  },
  {
    name: "cpf_lookup",
    provider: "CPF / Serpro (futuro)",
    category: "maps",
    requiredEnvVars: ["CPF_LOOKUP_ENABLED"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (env.CPF_LOOKUP_ENABLED === "1" ? "PARTIAL" : "NOT_CONFIGURED"),
    resolveMessage: () => "Validação CPF × nome preparada — integração externa opcional.",
    recommendedAction: "Defina CPF_LOOKUP_ENABLED=1 quando integrar provedor KYC.",
  },
  {
    name: "viacep",
    provider: "ViaCEP",
    category: "maps",
    requiredEnvVars: [],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: () => "ACTIVE",
    resolveMessage: () => "Consulta de CEP via ViaCEP (API pública, sem chave).",
    recommendedAction: "Nenhuma ação necessária.",
  },
  {
    name: "google_maps",
    provider: "Google Maps",
    category: "maps",
    requiredEnvVars: ["GOOGLE_MAPS_API_KEY"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isGoogleMapsConfigured(env) ? "PARTIAL" : "NOT_CONFIGURED"),
    resolveMessage: () => "Geocodificação Google Maps preparada, não ativa sem chave.",
    recommendedAction: "Defina GOOGLE_MAPS_API_KEY.",
  },
  {
    name: "google_analytics",
    provider: "Google Analytics 4",
    category: "analytics",
    requiredEnvVars: ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) =>
      isGoogleAnalyticsConfigured(env) ? "ACTIVE" : "NOT_CONFIGURED",
    resolveMessage: (env = process.env) =>
      isGoogleAnalyticsConfigured(env)
        ? "GA4 configurado (gtag + Consent Mode v2)."
        : "NEXT_PUBLIC_GA_MEASUREMENT_ID ausente ou inválido.",
    recommendedAction: "Defina NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXX no ambiente de produção.",
  },
  {
    name: "google_tag_manager",
    provider: "Google Tag Manager",
    category: "analytics",
    requiredEnvVars: ["NEXT_PUBLIC_GTM_ID"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) =>
      isGoogleTagManagerConfigured(env) ? "ACTIVE" : "NOT_CONFIGURED",
    resolveMessage: (env = process.env) =>
      isGoogleTagManagerConfigured(env)
        ? "GTM configurado (dataLayer namespaced + Consent Mode v2)."
        : "NEXT_PUBLIC_GTM_ID ausente ou inválido.",
    recommendedAction:
      "Defina NEXT_PUBLIC_GTM_ID=GTM-XXXX. Não duplique tags GA4 no container se o EcoPet já envia via gtag.",
  },
  {
    name: "mapbox",
    provider: "Mapbox",
    category: "maps",
    requiredEnvVars: ["MAPBOX_ACCESS_TOKEN"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) => (isMapboxConfigured(env) ? "PARTIAL" : "NOT_CONFIGURED"),
    resolveMessage: () => "Mapbox preparado, não ativo sem token.",
    recommendedAction: "Defina MAPBOX_ACCESS_TOKEN.",
  },
  {
    name: "whatsapp",
    provider: "WhatsApp Business",
    category: "messaging",
    requiredEnvVars: ["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: () => "DISABLED",
    resolveMessage: () => "Integração WhatsApp desabilitada — não implementada.",
    recommendedAction: "Implementar na etapa futura de mensageria.",
  },
  {
    name: "shipping",
    provider: "Correios / Melhor Envio",
    category: "shipping",
    requiredEnvVars: ["MELHOR_ENVIO_TOKEN ou CORREIOS_API_TOKEN"],
    canRunInProduction: true,
    canRunInDevelopment: true,
    resolveStatus: (env = process.env) =>
      isShippingCarrierConfigured(env) ? "PARTIAL" : "NOT_CONFIGURED",
    resolveMessage: () => "Logística interna ativa; transportadoras externas não integradas.",
    recommendedAction: "Configure MELHOR_ENVIO_TOKEN ou CORREIOS_API_TOKEN.",
  },
  {
    name: "erp",
    provider: "ERP",
    category: "erp",
    requiredEnvVars: [],
    canRunInProduction: false,
    canRunInDevelopment: false,
    resolveStatus: () => "DISABLED",
    resolveMessage: () => "Integração ERP desabilitada propositalmente.",
    recommendedAction: "Planejar integração ERP em etapa futura.",
  },
];

export function getIntegrationDefinition(name: string): IntegrationDefinition | undefined {
  return INTEGRATION_DEFINITIONS.find((d) => d.name === name);
}

export function resolveConfiguredVars(def: IntegrationDefinition, env = process.env): string[] {
  if (def.name === "smtp") {
    const configured: string[] = [];
    if (env.SMTP_HOST?.trim()) configured.push("SMTP_HOST");
    if (env.SMTP_USER?.trim()) configured.push("SMTP_USER");
    if (env.SMTP_PASS?.trim() || env.SMTP_PASSWORD?.trim()) configured.push("SMTP_PASS");
    return configured;
  }
  if (def.name === "email") {
    const configured: string[] = [];
    if (isSmtpConfigured(env)) configured.push("SMTP");
    if (isResendConfigured(env)) configured.push("RESEND_API_KEY");
    return configured;
  }
  if (def.name === "payment_gateway") {
    const p = resolveActivePaymentProvider(env);
    return p ? [p] : [];
  }
  return configuredEnvVars(
    def.requiredEnvVars.filter((k) => !k.includes("/") && !k.includes(" ")),
    env
  );
}

export function resolveMissingVars(def: IntegrationDefinition, env = process.env): string[] {
  if (def.name === "email") {
    if (isEmailConfigured(env)) return [];
    return ["SMTP_HOST/SMTP_USER/SMTP_PASS ou RESEND_API_KEY"];
  }
  if (def.name === "payment_gateway") {
    if (resolveActivePaymentProvider(env)) return [];
    return ["PAYMENT_PROVIDER + credenciais do provedor"];
  }
  return def.requiredEnvVars.filter((k) => {
    if (k.includes("/") || k.includes(" ")) return true;
    return !configuredEnvVars([k], env).length;
  });
}
