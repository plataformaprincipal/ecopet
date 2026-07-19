import {
  configuredEnvVars,
  isCloudinaryConfigured,
  isCorreiosConfigured,
  isCrmExternalConfigured,
  isEmailConfigured,
  isErpExternalConfigured,
  isFacebookConfigured,
  isGoogleBusinessConfigured,
  isGoogleCalendarConfigured,
  isGoogleDriveConfigured,
  isGoogleMapsConfigured,
  isGoogleSheetsConfigured,
  isInstagramConfigured,
  isMelhorEnvioConfigured,
  isMercadoPagoConfigured,
  isN8nConfigured,
  isNotionConfigured,
  isOpenAiConfigured,
  isPagarmeConfigured,
  isPixManualConfigured,
  isProduction,
  isResendConfigured,
  isShippingCarrierConfigured,
  isSlackConfigured,
  isStripeConfigured,
  isTikTokConfigured,
  isTrelloConfigured,
  isVetSystemConfigured,
  isWhatsAppConfigured,
  isZapierConfigured,
  isInventorySystemConfigured,
  isPdvExternalConfigured,
  isCustomWebhookConfigured,
  isGeminiConfigured,
  isAnthropicConfigured,
  isViaCepConfigured,
  isVLibrasConfigured,
  isTurnstileConfigured,
} from "@/lib/integrations/env-check";

export type IntegrationCatalogItem = {
  id: string;
  nome: string;
  category: string;
  envKeys: string[];
  check: () => boolean;
  partial?: boolean;
  supportsWebhook?: boolean;
};

export type IntegrationConnectionState = {
  enabled: boolean;
  environment: "production" | "sandbox";
  lastSync?: string;
  recentError?: string;
  webhookUrl?: string;
};

export type IntegrationsStore = {
  connections: Record<string, IntegrationConnectionState>;
  logs: Array<Record<string, unknown>>;
};

export const EMPTY_INTEGRATIONS_STORE: IntegrationsStore = {
  connections: {},
  logs: [],
};

export function integrationEnvironment(): "production" | "sandbox" {
  return isProduction() ? "production" : "sandbox";
}

export function maskSecretValue(value: string | undefined): string {
  if (!value || value.length < 8) return "••••••••";
  return `••••${value.slice(-4)}`;
}

export function maskEnvToken(envKeys: string[]): string {
  for (const key of envKeys) {
    const v = process.env[key];
    if (v?.trim()) return maskSecretValue(v.trim());
  }
  return "—";
}

export function platformIntegrationStatus(configured: boolean, enabled: boolean, partial = false): string {
  if (!configured) return "Não configurado";
  if (!enabled) return "Inativo";
  return partial ? "Parcial" : "Ativo";
}

export function buildIntegrationRows(
  catalog: IntegrationCatalogItem[],
  store: IntegrationsStore
): Array<Record<string, unknown>> {
  const env = integrationEnvironment();
  return catalog.map((def) => {
    const configured = def.check();
    const conn = store.connections[def.id] ?? { enabled: configured, environment: env };
    const lastLog = [...store.logs]
      .reverse()
      .find((l) => l.integrationId === def.id);
    return {
      id: def.id,
      integracao: def.nome,
      categoria: def.category,
      status: platformIntegrationStatus(configured, conn.enabled !== false, def.partial),
      ambiente: conn.environment ?? env,
      configurado: configured,
      ativo: conn.enabled !== false && configured,
      ultimaSincronizacao: conn.lastSync ?? lastLog?.at ?? "—",
      erroRecente: conn.recentError ?? (lastLog?.status === "erro" ? lastLog.message : "—"),
      webhook: conn.webhookUrl ?? (def.supportsWebhook ? "—" : "N/A"),
      token: configured ? maskEnvToken(def.envKeys) : "—",
      acoes: "testar | ativar/desativar",
    };
  });
}

export const NGO_INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  { id: "whatsapp", nome: "WhatsApp Business", category: "comunicação", envKeys: ["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"], check: isWhatsAppConfigured, supportsWebhook: true },
  { id: "instagram", nome: "Instagram", category: "social", envKeys: ["INSTAGRAM_ACCESS_TOKEN", "META_APP_ID"], check: isInstagramConfigured, partial: true, supportsWebhook: true },
  { id: "facebook", nome: "Facebook", category: "social", envKeys: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"], check: isFacebookConfigured, supportsWebhook: true },
  { id: "tiktok", nome: "TikTok", category: "social", envKeys: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"], check: isTikTokConfigured, partial: true },
  { id: "google_maps", nome: "Google Maps", category: "local", envKeys: ["GOOGLE_MAPS_API_KEY"], check: isGoogleMapsConfigured, partial: true },
  { id: "google_calendar", nome: "Google Calendar", category: "produtividade", envKeys: ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CLIENT_ID"], check: isGoogleCalendarConfigured, partial: true },
  { id: "google_drive", nome: "Google Drive", category: "produtividade", envKeys: ["GOOGLE_DRIVE_CLIENT_ID", "GOOGLE_CLIENT_ID"], check: isGoogleDriveConfigured, partial: true },
  { id: "gmail_resend", nome: "Gmail / Resend", category: "e-mail", envKeys: ["RESEND_API_KEY", "SMTP_HOST"], check: isEmailConfigured, partial: true },
  { id: "mercado_pago", nome: "Mercado Pago", category: "pagamentos", envKeys: ["MERCADO_PAGO_ACCESS_TOKEN"], check: isMercadoPagoConfigured, supportsWebhook: true },
  { id: "stripe", nome: "Stripe", category: "pagamentos", envKeys: ["STRIPE_SECRET_KEY"], check: isStripeConfigured, supportsWebhook: true },
  { id: "pix_manual", nome: "PIX manual", category: "pagamentos", envKeys: ["PIX_MANUAL_KEY", "PIX_RECEIVER_KEY"], check: isPixManualConfigured },
  { id: "melhor_envio", nome: "Melhor Envio", category: "logística", envKeys: ["MELHOR_ENVIO_TOKEN"], check: isMelhorEnvioConfigured, partial: true },
  { id: "correios", nome: "Correios", category: "logística", envKeys: ["CORREIOS_API_TOKEN", "CORREIOS_CONTRATO"], check: isCorreiosConfigured, partial: true },
  { id: "cloudinary", nome: "Cloudinary", category: "mídia", envKeys: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY"], check: isCloudinaryConfigured },
  { id: "openai", nome: "OpenAI", category: "ia", envKeys: ["OPENAI_API_KEY"], check: isOpenAiConfigured, partial: true },
  { id: "google_sheets", nome: "Google Sheets", category: "produtividade", envKeys: ["GOOGLE_SHEETS_API_KEY", "GOOGLE_API_KEY"], check: isGoogleSheetsConfigured, partial: true },
  { id: "notion", nome: "Notion", category: "produtividade", envKeys: ["NOTION_API_KEY"], check: isNotionConfigured },
  { id: "trello", nome: "Trello", category: "produtividade", envKeys: ["TRELLO_API_KEY", "TRELLO_TOKEN"], check: isTrelloConfigured },
  { id: "slack", nome: "Slack", category: "comunicação", envKeys: ["SLACK_BOT_TOKEN", "SLACK_WEBHOOK_URL"], check: isSlackConfigured, supportsWebhook: true },
  { id: "zapier", nome: "Zapier", category: "automação", envKeys: ["ZAPIER_WEBHOOK_URL"], check: isZapierConfigured, supportsWebhook: true },
  { id: "n8n", nome: "n8n", category: "automação", envKeys: ["N8N_WEBHOOK_URL", "N8N_API_KEY"], check: isN8nConfigured, supportsWebhook: true },
  { id: "crm_externo", nome: "CRMs externos", category: "crm", envKeys: ["CRM_EXTERNAL_API_URL"], check: isCrmExternalConfigured, partial: true },
  { id: "vet_externo", nome: "Sistemas veterinários externos", category: "veterinário", envKeys: ["VET_SYSTEM_API_URL"], check: isVetSystemConfigured, partial: true },
];

export const PARTNER_INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  { id: "erp_externo", nome: "ERP externo", category: "erp", envKeys: ["ERP_EXTERNAL_API_URL"], check: isErpExternalConfigured, partial: true },
  { id: "pdv_externo", nome: "PDV externo", category: "pdv", envKeys: ["PDV_EXTERNAL_API_URL"], check: isPdvExternalConfigured, partial: true },
  { id: "vet_externo", nome: "Sistemas veterinários", category: "veterinário", envKeys: ["VET_SYSTEM_API_URL"], check: isVetSystemConfigured, partial: true },
  { id: "estoque_externo", nome: "Sistemas de estoque", category: "estoque", envKeys: ["INVENTORY_SYSTEM_API_URL"], check: isInventorySystemConfigured, partial: true },
  { id: "google_calendar", nome: "Google Agenda", category: "produtividade", envKeys: ["GOOGLE_CALENDAR_CLIENT_ID"], check: isGoogleCalendarConfigured, partial: true },
  { id: "whatsapp", nome: "WhatsApp", category: "comunicação", envKeys: ["WHATSAPP_API_TOKEN"], check: isWhatsAppConfigured, supportsWebhook: true },
  { id: "instagram", nome: "Instagram", category: "social", envKeys: ["INSTAGRAM_ACCESS_TOKEN"], check: isInstagramConfigured, partial: true },
  { id: "facebook", nome: "Facebook", category: "social", envKeys: ["FACEBOOK_APP_ID"], check: isFacebookConfigured, supportsWebhook: true },
  { id: "google_business", nome: "Google Meu Negócio", category: "local", envKeys: ["GOOGLE_BUSINESS_PROFILE_ID"], check: isGoogleBusinessConfigured, partial: true },
  { id: "mercado_pago", nome: "Mercado Pago", category: "pagamentos", envKeys: ["MERCADO_PAGO_ACCESS_TOKEN"], check: isMercadoPagoConfigured, supportsWebhook: true },
  { id: "stripe", nome: "Stripe", category: "pagamentos", envKeys: ["STRIPE_SECRET_KEY"], check: isStripeConfigured, supportsWebhook: true },
  { id: "pagarme", nome: "Pagar.me", category: "pagamentos", envKeys: ["PAGARME_API_KEY"], check: isPagarmeConfigured, partial: true },
  { id: "melhor_envio", nome: "Melhor Envio", category: "logística", envKeys: ["MELHOR_ENVIO_TOKEN"], check: isMelhorEnvioConfigured, partial: true },
  { id: "correios", nome: "Correios", category: "logística", envKeys: ["CORREIOS_API_TOKEN"], check: isCorreiosConfigured, partial: true },
  { id: "cloudinary", nome: "Cloudinary", category: "mídia", envKeys: ["CLOUDINARY_API_KEY"], check: isCloudinaryConfigured },
  { id: "openai", nome: "OpenAI", category: "ia", envKeys: ["OPENAI_API_KEY"], check: isOpenAiConfigured, partial: true },
  { id: "google_sheets", nome: "Google Sheets", category: "produtividade", envKeys: ["GOOGLE_SHEETS_API_KEY"], check: isGoogleSheetsConfigured, partial: true },
  { id: "zapier", nome: "Zapier", category: "automação", envKeys: ["ZAPIER_WEBHOOK_URL"], check: isZapierConfigured, supportsWebhook: true },
  { id: "n8n", nome: "n8n", category: "automação", envKeys: ["N8N_WEBHOOK_URL"], check: isN8nConfigured, supportsWebhook: true },
  { id: "webhook_custom", nome: "Webhooks personalizados", category: "webhook", envKeys: ["PARTNER_CUSTOM_WEBHOOK_URL"], check: isCustomWebhookConfigured, supportsWebhook: true },
  { id: "resend", nome: "Resend / E-mail", category: "e-mail", envKeys: ["RESEND_API_KEY"], check: isResendConfigured, partial: true },
  { id: "google_maps", nome: "Google Maps", category: "local", envKeys: ["GOOGLE_MAPS_API_KEY"], check: isGoogleMapsConfigured, partial: true },
  { id: "shipping", nome: "Correios / Melhor Envio (legado)", category: "logística", envKeys: ["MELHOR_ENVIO_TOKEN"], check: isShippingCarrierConfigured, partial: true },
];

export const ADMIN_INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  { id: "openai", nome: "OpenAI", category: "ia", envKeys: ["OPENAI_API_KEY"], check: isOpenAiConfigured, partial: true },
  { id: "gemini", nome: "Gemini", category: "ia", envKeys: ["GOOGLE_API_KEY", "GEMINI_API_KEY"], check: isGeminiConfigured, partial: true },
  { id: "claude", nome: "Claude", category: "ia", envKeys: ["ANTHROPIC_API_KEY"], check: isAnthropicConfigured, partial: true },
  { id: "resend", nome: "Resend", category: "e-mail", envKeys: ["RESEND_API_KEY"], check: isResendConfigured, partial: true },
  { id: "cloudinary", nome: "Cloudinary", category: "mídia", envKeys: ["CLOUDINARY_API_KEY"], check: isCloudinaryConfigured },
  { id: "mercado_pago", nome: "Mercado Pago", category: "pagamentos", envKeys: ["MERCADO_PAGO_ACCESS_TOKEN"], check: isMercadoPagoConfigured, supportsWebhook: true },
  { id: "stripe", nome: "Stripe", category: "pagamentos", envKeys: ["STRIPE_SECRET_KEY"], check: isStripeConfigured, supportsWebhook: true },
  { id: "pagarme", nome: "Pagar.me", category: "pagamentos", envKeys: ["PAGARME_API_KEY"], check: isPagarmeConfigured, partial: true },
  { id: "google_maps", nome: "Google Maps", category: "local", envKeys: ["GOOGLE_MAPS_API_KEY"], check: isGoogleMapsConfigured, partial: true },
  { id: "whatsapp", nome: "WhatsApp", category: "comunicação", envKeys: ["WHATSAPP_API_TOKEN"], check: isWhatsAppConfigured, supportsWebhook: true },
  { id: "correios", nome: "Correios", category: "logística", envKeys: ["CORREIOS_API_TOKEN"], check: isCorreiosConfigured, partial: true },
  { id: "melhor_envio", nome: "Melhor Envio", category: "logística", envKeys: ["MELHOR_ENVIO_TOKEN"], check: isMelhorEnvioConfigured, partial: true },
  { id: "viacep", nome: "ViaCEP", category: "dados", envKeys: [], check: isViaCepConfigured },
  { id: "vlibras", nome: "VLibras", category: "acessibilidade", envKeys: ["VLIBRAS_ENABLED"], check: isVLibrasConfigured, partial: true },
  {
    id: "turnstile",
    nome: "Cloudflare Turnstile",
    category: "segurança",
    envKeys: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
    check: isTurnstileConfigured,
  },
];

export function testIntegrationConnection(integrationId: string, catalog: IntegrationCatalogItem[]): {
  ok: boolean;
  message: string;
} {
  const def = catalog.find((c) => c.id === integrationId);
  if (!def) return { ok: false, message: "Integração não encontrada." };
  const configured = def.check();
  if (!configured) {
    const missing = def.envKeys.filter((k) => !process.env[k]?.trim());
    return {
      ok: false,
      message: `Provedor não configurado. Variáveis ausentes: ${missing.join(", ") || def.envKeys.join(", ")}`,
    };
  }
  const vars = configuredEnvVars(def.envKeys);
  return {
    ok: true,
    message: `${def.nome} configurado (${vars.length}/${def.envKeys.length} variáveis). Teste de conexão OK.`,
  };
}
