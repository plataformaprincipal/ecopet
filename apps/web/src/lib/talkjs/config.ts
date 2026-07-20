/**
 * Configuração central TalkJS — pública vs privada.
 * Nunca expor TALKJS_SECRET_KEY / TALKJS_WEBHOOK_SECRET no frontend.
 */
export type TalkJsEnvironment = "test" | "production" | "unknown";

function trim(v: string | undefined): string | null {
  const t = v?.trim();
  return t || null;
}

function flag(name: string, defaultOn: boolean): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  return defaultOn;
}

export function getTalkJsPublicConfig() {
  return {
    appId: trim(process.env.NEXT_PUBLIC_TALKJS_APP_ID),
  };
}

export function getTalkJsPrivateConfig() {
  const envRaw = trim(process.env.TALKJS_ENVIRONMENT)?.toLowerCase();
  const environment: TalkJsEnvironment =
    envRaw === "production" || envRaw === "live"
      ? "production"
      : envRaw === "test"
        ? "test"
        : "unknown";

  const apiBase =
    trim(process.env.TALKJS_API_BASE_URL)?.replace(/\/$/, "") ?? "https://api.talkjs.com";

  return {
    secretKey: trim(process.env.TALKJS_SECRET_KEY),
    webhookSecret: trim(process.env.TALKJS_WEBHOOK_SECRET),
    environment,
    apiBaseUrl: apiBase,
    apiV1Base: `${apiBase}/v1`,
  };
}

export function isTalkJsPublicConfigured(): boolean {
  return Boolean(getTalkJsPublicConfig().appId);
}

export function isTalkJsServerConfigured(): boolean {
  const pub = getTalkJsPublicConfig();
  const priv = getTalkJsPrivateConfig();
  return Boolean(pub.appId && priv.secretKey);
}

export type MessagingFeatureFlag =
  | "talkjs"
  | "inbox"
  | "marketplace_chat"
  | "partner_chat"
  | "ngo_chat"
  | "adoption_chat"
  | "support_chat"
  | "attachments"
  | "notifications"
  | "firebase_push"
  | "ai_assist"
  | "moderation"
  | "automations"
  | "webhooks";

const FLAG_ENV: Record<MessagingFeatureFlag, string> = {
  talkjs: "MSG_FLAG_TALKJS",
  inbox: "MSG_FLAG_INBOX",
  marketplace_chat: "MSG_FLAG_MARKETPLACE",
  partner_chat: "MSG_FLAG_PARTNER",
  ngo_chat: "MSG_FLAG_NGO",
  adoption_chat: "MSG_FLAG_ADOPTION",
  support_chat: "MSG_FLAG_SUPPORT",
  attachments: "MSG_FLAG_ATTACHMENTS",
  notifications: "MSG_FLAG_NOTIFICATIONS",
  firebase_push: "MSG_FLAG_FIREBASE",
  ai_assist: "MSG_FLAG_AI",
  moderation: "MSG_FLAG_MODERATION",
  automations: "MSG_FLAG_AUTOMATIONS",
  webhooks: "MSG_FLAG_WEBHOOKS",
};

export function isMessagingFlagEnabled(name: MessagingFeatureFlag): boolean {
  if (name === "talkjs" || name === "inbox") {
    if (!isTalkJsPublicConfigured()) return false;
  }
  if (name === "webhooks") {
    // Webhooks: default OFF until secret exists (safe default)
    const priv = getTalkJsPrivateConfig();
    const hasSecret = Boolean(priv.webhookSecret || priv.secretKey);
    const envForce = process.env.MSG_FLAG_WEBHOOKS?.trim().toLowerCase();
    if (envForce === "true" || envForce === "1" || envForce === "on") return hasSecret;
    if (envForce === "false" || envForce === "0" || envForce === "off") return false;
    // production requires webhook secret; test may use secret key
    if (priv.environment === "production") return Boolean(priv.webhookSecret);
    return hasSecret && flag("MSG_FLAG_WEBHOOKS", true);
  }
  return flag(FLAG_ENV[name], true);
}

export function listMessagingFeatureFlags(): Record<MessagingFeatureFlag, boolean> {
  const out = {} as Record<MessagingFeatureFlag, boolean>;
  for (const key of Object.keys(FLAG_ENV) as MessagingFeatureFlag[]) {
    out[key] = isMessagingFlagEnabled(key);
  }
  return out;
}

/** Health sanitizado — nunca inclui secrets. */
export function getTalkJsHealthSnapshot() {
  const pub = getTalkJsPublicConfig();
  const priv = getTalkJsPrivateConfig();
  return {
    configured: isTalkJsServerConfigured(),
    publicAppIdPresent: Boolean(pub.appId),
    publicAppIdPreview: pub.appId ? `${pub.appId.slice(0, 4)}…` : null,
    secretConfigured: Boolean(priv.secretKey),
    webhookSecretConfigured: Boolean(priv.webhookSecret),
    environment: priv.environment,
    apiBaseHost: (() => {
      try {
        return new URL(priv.apiBaseUrl).host;
      } catch {
        return "invalid";
      }
    })(),
    flags: listMessagingFeatureFlags(),
    identityVerificationReady: Boolean(priv.secretKey),
    webhookReady:
      isMessagingFlagEnabled("webhooks") &&
      Boolean(priv.webhookSecret || (priv.environment !== "production" && priv.secretKey)),
  };
}

/**
 * ID TalkJS estável = ID EcoPet (cuid).
 * Não usar e-mail/CPF/telefone. Prefixo documentado opcional evitado
 * para não quebrar usuários já sincronizados em Test Mode.
 */
export function toTalkJsUserId(ecopetUserId: string): string {
  return ecopetUserId;
}
