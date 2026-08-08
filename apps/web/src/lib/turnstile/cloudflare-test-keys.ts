/**
 * Chaves oficiais de teste do Cloudflare Turnstile (documentação pública).
 * Não são segredos reais — públicas em:
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 *
 * Usadas apenas quando TURNSTILE_ALLOW_CLOUDFLARE_TEST_KEYS está ativo
 * e o ambiente NÃO é Production Vercel.
 */

import { detectTurnstileEnvironment } from "./hostname";

/** Token dummy gerado pelas sitekeys oficiais de teste. */
export const CLOUDFLARE_TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

/** Sitekey oficial: always passes (visible). */
export const CLOUDFLARE_TURNSTILE_TEST_SITEKEY_ALWAYS_PASS =
  "1x00000000000000000000AA";

/** Secret oficial: always passes siteverify. */
export const CLOUDFLARE_TURNSTILE_TEST_SECRET_ALWAYS_PASS =
  "1x0000000000000000000000000000000AA";

/** Hostname retornado pelo siteverify para o dummy token. */
export const CLOUDFLARE_TURNSTILE_DUMMY_HOSTNAME = "example.com";

function envFlagTrue(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/**
 * Preview/development com flag explícita — nunca Production.
 * Fail-closed se VERCEL_ENV=production ou environment=production.
 */
export function isCloudflareTurnstileTestKeysAllowed(
  source: NodeJS.ProcessEnv = process.env
): boolean {
  if (source.VERCEL_ENV === "production") return false;
  if (detectTurnstileEnvironment(source) === "production") return false;
  return envFlagTrue(source.TURNSTILE_ALLOW_CLOUDFLARE_TEST_KEYS);
}

export function isCloudflareTurnstileDummyToken(token: string | null | undefined): boolean {
  return typeof token === "string" && token.trim() === CLOUDFLARE_TURNSTILE_DUMMY_TOKEN;
}

/**
 * Quando permitido e o cliente enviou o dummy token oficial,
 * siteverify deve usar o secret de teste público (não o secret de Production).
 */
export function resolveTurnstileSiteverifySecret(
  token: string,
  productionSecret: string,
  source: NodeJS.ProcessEnv = process.env
): { secret: string; usingOfficialTestSecret: boolean } {
  if (
    isCloudflareTurnstileTestKeysAllowed(source) &&
    isCloudflareTurnstileDummyToken(token)
  ) {
    return {
      secret: CLOUDFLARE_TURNSTILE_TEST_SECRET_ALWAYS_PASS,
      usingOfficialTestSecret: true,
    };
  }
  return { secret: productionSecret, usingOfficialTestSecret: false };
}

/** Production não pode operar com site/secret oficiais de teste. */
export function usesOfficialCloudflareTestCredentials(
  source: NodeJS.ProcessEnv = process.env
): boolean {
  const site = source.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secret = source.TURNSTILE_SECRET_KEY?.trim();
  return (
    site === CLOUDFLARE_TURNSTILE_TEST_SITEKEY_ALWAYS_PASS ||
    secret === CLOUDFLARE_TURNSTILE_TEST_SECRET_ALWAYS_PASS
  );
}
