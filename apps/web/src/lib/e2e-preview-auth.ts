/**
 * Autorização fail-closed para automação E2E exclusiva em Vercel Preview.
 * Não reutiliza VERCEL_AUTOMATION_BYPASS_SECRET (Deployment Protection).
 */

export const E2E_TEST_HEADER = "x-ecopet-e2e-test";

function envFlagTrue(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function readEnv(source: NodeJS.ProcessEnv, key: string): string | undefined {
  // Lookup dinâmico — evita surpresas de substituição estática no bundle.
  const raw = source[key];
  if (typeof raw !== "string") return undefined;
  return raw.replace(/^\uFEFF/, "").trim();
}

/**
 * Todas as condições devem ser verdadeiras:
 * - VERCEL_ENV === "preview" (nunca Production)
 * - E2E_TEST_MODE=true
 * - header x-ecopet-e2e-test === E2E_TEST_SECRET (Preview-only)
 */
export function isAuthorizedE2ePreviewRequest(
  request: Request,
  source: NodeJS.ProcessEnv = process.env
): boolean {
  const vercelEnv = readEnv(source, "VERCEL_ENV");
  if (vercelEnv === "production") return false;
  if (vercelEnv !== "preview") return false;
  if (!envFlagTrue(readEnv(source, "E2E_TEST_MODE"))) return false;

  const secret = readEnv(source, "E2E_TEST_SECRET");
  if (!secret) return false;

  const header = request.headers.get(E2E_TEST_HEADER)?.trim();
  if (!header) return false;

  // Comparação em tempo constante o suficiente para secret curto de teste.
  if (header.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= header.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

/** Quando autorizado, login/register não devem 429 pela carga E2E esperada. */
export function shouldSkipAuthRateLimitForE2e(request: Request): boolean {
  return isAuthorizedE2ePreviewRequest(request);
}
