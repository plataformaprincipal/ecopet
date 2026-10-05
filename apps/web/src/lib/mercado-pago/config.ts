/**
 * Configuração Mercado Pago (Checkout Transparente / API Orders).
 * getMercadoPagoServerConfig() retorna o Access Token — chamar só no servidor.
 * Não importar getMercadoPagoServerConfig em Client Components.
 */

export type MercadoPagoEnvironment = "test" | "production";

export type MercadoPagoServerConfig = {
  accessToken: string;
  environment: MercadoPagoEnvironment;
  webhookSecret?: string;
  apiBaseUrl: string;
  timeoutMs: number;
  configured: true;
};

export type MercadoPagoPublicConfig = {
  publicKey: string;
  environment: MercadoPagoEnvironment;
  apiOrders: true;
  configured: boolean;
};

export type MercadoPagoSanitizedStatus = {
  provider: "mercado_pago";
  configured: boolean;
  environment: MercadoPagoEnvironment;
  publicKeyConfigured: boolean;
  accessTokenConfigured: boolean;
  webhookSecretConfigured: boolean;
  api: "orders";
  status:
    | "NOT_CONFIGURED"
    | "TEST_READY"
    | "WEBHOOK_PENDING"
    | "ACTIVE"
    | "DEGRADED"
    | "AUTH_ERROR"
    | "WEBHOOK_ERROR"
    | "ERROR";
  sanitizedMessage?: string;
};

function env(key: string, source: NodeJS.ProcessEnv = process.env): string | undefined {
  const v = source[key]?.trim();
  return v || undefined;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v.includes("xxxxxxxxx") ||
    v.includes("your_") ||
    v.includes("changeme") ||
    v.includes("replace") ||
    v === "test" ||
    v === "xxx"
  );
}

export function getMercadoPagoEnvironment(
  source: NodeJS.ProcessEnv = process.env
): MercadoPagoEnvironment {
  const vercelEnv = (env("VERCEL_ENV", source) || "").toLowerCase();
  if (vercelEnv === "production") {
    return "production";
  }
  const raw = (env("MERCADO_PAGO_ENVIRONMENT", source) || "").toLowerCase();
  if (raw === "production" || raw === "prod" || raw === "live") {
    return "production";
  }
  return "test";
}

export function isMercadoPagoConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  const token = env("MERCADO_PAGO_ACCESS_TOKEN", source);
  return Boolean(token && !isPlaceholder(token));
}

export function isMercadoPagoTestMode(source: NodeJS.ProcessEnv = process.env): boolean {
  return getMercadoPagoEnvironment(source) === "test";
}

export function getMercadoPagoPublicKey(source: NodeJS.ProcessEnv = process.env): string | undefined {
  return (
    env("NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY", source) ||
    env("MERCADO_PAGO_PUBLIC_KEY", source)
  );
}

export function getMercadoPagoServerConfig(
  source: NodeJS.ProcessEnv = process.env
): MercadoPagoServerConfig | null {
  if (typeof process !== "undefined" && process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }
  const accessToken = env("MERCADO_PAGO_ACCESS_TOKEN", source);
  if (!accessToken || isPlaceholder(accessToken)) return null;

  return {
    accessToken,
    environment: getMercadoPagoEnvironment(source),
    webhookSecret: env("MERCADO_PAGO_WEBHOOK_SECRET", source),
    apiBaseUrl: "https://api.mercadopago.com",
    timeoutMs: Number(env("MERCADO_PAGO_TIMEOUT_MS", source) || "20000"),
    configured: true,
  };
}

/**
 * Canal online LIVE: Access Token + Public Key.
 * PAYMENT_PROVIDER não pode 503 o checkout quando as credenciais LIVE já estão ACTIVE.
 */
export function isMercadoPagoPaymentEnabled(source: NodeJS.ProcessEnv = process.env): boolean {
  const publicKey = getMercadoPagoPublicKey(source);
  return Boolean(isMercadoPagoConfigured(source) && publicKey && !isPlaceholder(publicKey));
}

/** Pronto para Checkout Transparente LIVE: Access Token + Public Key LIVE presentes. */
export function isMercadoPagoCheckoutAvailable(source: NodeJS.ProcessEnv = process.env): boolean {
  return getMercadoPagoPublicConfig(source).configured;
}

/**
 * Config pública do SDK. Usa somente credenciais LIVE.
 * Não aplica regras de /checkout-test (prefixo TEST-, isolamento sandbox).
 */
export function getMercadoPagoPublicConfig(
  source: NodeJS.ProcessEnv = process.env
): MercadoPagoPublicConfig {
  const environment = getMercadoPagoEnvironment(source);
  const publicKey = getMercadoPagoPublicKey(source);
  const keysOk = Boolean(
    publicKey && !isPlaceholder(publicKey) && isMercadoPagoConfigured(source)
  );

  return {
    publicKey: keysOk ? publicKey! : "",
    environment,
    apiOrders: true,
    configured: keysOk,
  };
}

export function getMercadoPagoSanitizedStatus(
  source: NodeJS.ProcessEnv = process.env
): MercadoPagoSanitizedStatus {
  const accessTokenConfigured = isMercadoPagoConfigured(source);
  const publicKey = getMercadoPagoPublicKey(source);
  const publicKeyConfigured = Boolean(publicKey && !isPlaceholder(publicKey));
  const webhookSecretConfigured = Boolean(env("MERCADO_PAGO_WEBHOOK_SECRET", source));
  const environment = getMercadoPagoEnvironment(source);

  if (!accessTokenConfigured) {
    return {
      provider: "mercado_pago",
      configured: false,
      environment,
      publicKeyConfigured,
      accessTokenConfigured: false,
      webhookSecretConfigured,
      api: "orders",
      status: "NOT_CONFIGURED",
      sanitizedMessage: "MERCADO_PAGO_ACCESS_TOKEN ausente.",
    };
  }

  if (!publicKeyConfigured) {
    return {
      provider: "mercado_pago",
      configured: true,
      environment,
      publicKeyConfigured: false,
      accessTokenConfigured: true,
      webhookSecretConfigured,
      api: "orders",
      status: "DEGRADED",
      sanitizedMessage: "Public Key ausente — checkout transparente incompleto.",
    };
  }

  if (!webhookSecretConfigured) {
    return {
      provider: "mercado_pago",
      configured: true,
      environment,
      publicKeyConfigured: true,
      accessTokenConfigured: true,
      webhookSecretConfigured: false,
      api: "orders",
      status: environment === "test" ? "TEST_READY" : "WEBHOOK_PENDING",
      sanitizedMessage:
        environment === "test"
          ? "Ambiente TEST pronto. Webhook secret ainda não configurado (notificações de teste limitadas)."
          : "Webhook secret pendente — cadastre https://eccopet.com/api/webhooks/mercado-pago",
    };
  }

  return {
    provider: "mercado_pago",
    configured: true,
    environment,
    publicKeyConfigured: true,
    accessTokenConfigured: true,
    webhookSecretConfigured: true,
    api: "orders",
    status: environment === "test" ? "TEST_READY" : "ACTIVE",
  };
}
