import "server-only";

/**
 * Credenciais EXCLUSIVAS do checkout de teste isolado (`/checkout-test`).
 * Lê somente MERCADO_PAGO_TEST_* / NEXT_PUBLIC_MERCADO_PAGO_TEST_*.
 * Nunca faz fallback para LIVE. Não valida prefixo (TEST-/APP_USR).
 */

export const CHECKOUT_TEST_NOTE_PREFIX = "[CHECKOUT-TEST]";

export const MP_TEST_MATCHES_LIVE_MESSAGE = "Credenciais TEST coincidem com LIVE.";

type EnvLike = Record<string, string | undefined>;

function env(key: string, source: EnvLike = process.env): string | undefined {
  const v = source[key]?.trim();
  return v || undefined;
}

export function getMercadoPagoTestAccessToken(source: EnvLike = process.env): string | undefined {
  return env("MERCADO_PAGO_TEST_ACCESS_TOKEN", source);
}

export function getMercadoPagoTestPublicKey(source: EnvLike = process.env): string | undefined {
  return env("NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY", source);
}

function testCredentialsMatchLive(source: EnvLike = process.env): boolean {
  const testToken = getMercadoPagoTestAccessToken(source);
  const testPublicKey = getMercadoPagoTestPublicKey(source);
  const liveToken = env("MERCADO_PAGO_ACCESS_TOKEN", source);
  const livePublicKey = env("NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY", source);
  if (testToken && liveToken && testToken === liveToken) return true;
  if (testPublicKey && livePublicKey && testPublicKey === livePublicKey) return true;
  return false;
}

export function getMercadoPagoTestCheckoutBlock(source: EnvLike = process.env): {
  code: "MP_TEST_NOT_CONFIGURED" | "MP_TEST_MATCHES_LIVE";
  message: string;
} | null {
  const accessToken = getMercadoPagoTestAccessToken(source);
  const publicKey = getMercadoPagoTestPublicKey(source);
  if (!accessToken || !publicKey) {
    return {
      code: "MP_TEST_NOT_CONFIGURED",
      message:
        "Checkout de teste bloqueado: MERCADO_PAGO_TEST_ACCESS_TOKEN e NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY são obrigatórias.",
    };
  }
  if (testCredentialsMatchLive(source)) {
    return {
      code: "MP_TEST_MATCHES_LIVE",
      message: MP_TEST_MATCHES_LIVE_MESSAGE,
    };
  }
  return null;
}

export function isMercadoPagoTestCheckoutConfigured(source: EnvLike = process.env): boolean {
  return getMercadoPagoTestCheckoutBlock(source) === null;
}

export function getMercadoPagoTestServerConfig(source: EnvLike = process.env): {
  accessToken: string;
  publicKey: string;
  environment: "test";
  apiBaseUrl: string;
  timeoutMs: number;
} | null {
  if (typeof process !== "undefined" && process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }
  if (getMercadoPagoTestCheckoutBlock(source)) return null;
  const accessToken = getMercadoPagoTestAccessToken(source);
  const publicKey = getMercadoPagoTestPublicKey(source);
  if (!accessToken || !publicKey) return null;
  return {
    accessToken,
    publicKey,
    environment: "test",
    apiBaseUrl: "https://api.mercadopago.com",
    timeoutMs: 20_000,
  };
}

/** Public Key TEST + status. Nunca inclui Access Token. */
export function getMercadoPagoTestPublicConfig(source: EnvLike = process.env): {
  publicKey: string;
  environment: "test";
  configured: boolean;
  apiOrders: true;
} {
  const configured = isMercadoPagoTestCheckoutConfigured(source);
  const publicKey = configured ? getMercadoPagoTestPublicKey(source)! : "";
  return {
    publicKey,
    environment: "test",
    configured,
    apiOrders: true,
  };
}

export function isCheckoutTestOrderNotes(notes: string | null | undefined): boolean {
  return String(notes ?? "").startsWith(CHECKOUT_TEST_NOTE_PREFIX);
}

export function buildCheckoutTestNotes(userNotes?: string | null): string {
  const extra = userNotes?.trim();
  return extra
    ? `${CHECKOUT_TEST_NOTE_PREFIX} AMBIENTE DE TESTE — NENHUMA COBRANÇA REAL. ${extra}`
    : `${CHECKOUT_TEST_NOTE_PREFIX} AMBIENTE DE TESTE — NENHUMA COBRANÇA REAL.`;
}
