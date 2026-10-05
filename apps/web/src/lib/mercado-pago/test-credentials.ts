import "server-only";

/**
 * Credenciais EXCLUSIVAS do checkout de teste isolado (`/checkout-test`).
 * Nunca lê MERCADO_PAGO_ACCESS_TOKEN / NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY.
 * Nunca faz fallback para LIVE.
 */

export const CHECKOUT_TEST_NOTE_PREFIX = "[CHECKOUT-TEST]";

type EnvLike = Record<string, string | undefined>;

function env(key: string, source: EnvLike = process.env): string | undefined {
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

/** Aceita apenas credenciais de sandbox (TEST-). APP_USR é rejeitado. */
function isSandboxCredential(value: string | undefined): boolean {
  if (!value || isPlaceholder(value)) return false;
  return value.startsWith("TEST-") && value.length > 12;
}

export function getMercadoPagoTestAccessToken(source: EnvLike = process.env): string | undefined {
  const token = env("MERCADO_PAGO_TEST_ACCESS_TOKEN", source);
  return isSandboxCredential(token) ? token : undefined;
}

export function getMercadoPagoTestPublicKey(source: EnvLike = process.env): string | undefined {
  const key = env("NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY", source);
  return isSandboxCredential(key) ? key : undefined;
}

export function isMercadoPagoTestCheckoutConfigured(source: EnvLike = process.env): boolean {
  return Boolean(getMercadoPagoTestAccessToken(source) && getMercadoPagoTestPublicKey(source));
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
