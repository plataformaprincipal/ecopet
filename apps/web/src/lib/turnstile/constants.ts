/** Cloudflare Turnstile — constantes públicas (sem segredos). */

export const TURNSTILE_PROVIDER = "cloudflare_turnstile" as const;

export const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Token Tipicamente ~100–2048 chars; limite defensivo. */
export const TURNSTILE_TOKEN_MIN_LENGTH = 20;
export const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

export const TURNSTILE_DEFAULT_TIMEOUT_MS = 5000;

/** Retenção de hash de token usado (anti-replay interno), em horas. */
export const TURNSTILE_TOKEN_HASH_RETENTION_HOURS = 24;

/** Limiar de falhas de login (IP ou conta) para exigir desafio. */
export const LOGIN_TURNSTILE_FAILURE_THRESHOLD = 3;
export const LOGIN_TURNSTILE_WINDOW_MS = 15 * 60 * 1000;

export const TURNSTILE_INTEGRATION_STATUSES = [
  "NOT_CONFIGURED",
  "CONFIGURED",
  "ACTIVE",
  "DEGRADED",
  "DISABLED",
  "INVALID_SECRET",
  "HOSTNAME_ERROR",
  "ACTION_ERROR",
  "CLOUDFLARE_UNAVAILABLE",
  "ERROR",
] as const;

export type TurnstileIntegrationStatus = (typeof TURNSTILE_INTEGRATION_STATUSES)[number];
