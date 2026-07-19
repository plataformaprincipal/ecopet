import "server-only";

import { TURNSTILE_DEFAULT_TIMEOUT_MS, type TurnstileIntegrationStatus } from "./constants";
import { isTurnstileEnabled, isTurnstileSiteKeyConfigured, maskSiteKey } from "./config";
import { detectTurnstileEnvironment, getTurnstileAllowedHostnames } from "./hostname";
import type { TurnstileSanitizedStatus, TurnstileServerConfig } from "./types";

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
    v.includes("replace_me") ||
    v === "xxx"
  );
}

/** Nome da env secret — só neste módulo server-only. */
const SECRET_ENV = ["TURNSTILE", "SECRET", "KEY"].join("_");

export function isTurnstileSecretConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  const key = env(SECRET_ENV, source);
  return Boolean(key && !isPlaceholder(key));
}

export function isTurnstileConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return isTurnstileSiteKeyConfigured(source) && isTurnstileSecretConfigured(source);
}

/**
 * Habilitado no servidor: Site Key + Secret + flag.
 * Diferente do `isTurnstileEnabled` público (só Site Key).
 */
export function isTurnstileServerEnabled(source: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env("TURNSTILE_ENABLED", source)?.toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off" || flag === "disabled") {
    return false;
  }
  return isTurnstileConfigured(source);
}

/**
 * Config com Secret Key — somente servidor.
 * Nunca importar este módulo em Client Components.
 */
export function getTurnstileServerConfig(
  source: NodeJS.ProcessEnv = process.env
): TurnstileServerConfig | null {
  if (!isTurnstileConfigured(source)) return null;
  const siteKey = env("NEXT_PUBLIC_TURNSTILE_SITE_KEY", source)!;
  const secretKey = env(SECRET_ENV, source)!;
  const timeoutRaw = Number(env("TURNSTILE_TIMEOUT_MS", source) || TURNSTILE_DEFAULT_TIMEOUT_MS);
  const timeoutMs =
    Number.isFinite(timeoutRaw) && timeoutRaw >= 1000 && timeoutRaw <= 30_000
      ? timeoutRaw
      : TURNSTILE_DEFAULT_TIMEOUT_MS;

  return {
    siteKey,
    secretKey,
    enabled: isTurnstileServerEnabled(source),
    timeoutMs,
    allowedHostnames: getTurnstileAllowedHostnames(source),
    environment: detectTurnstileEnvironment(source),
  };
}

export function getTurnstileSanitizedStatus(
  source: NodeJS.ProcessEnv = process.env
): TurnstileSanitizedStatus {
  const siteKeyConfigured = isTurnstileSiteKeyConfigured(source);
  const secretKeyConfigured = isTurnstileSecretConfigured(source);
  const configured = siteKeyConfigured && secretKeyConfigured;
  const enabled = isTurnstileServerEnabled(source);
  const environment = detectTurnstileEnvironment(source);
  const allowedHostnames = getTurnstileAllowedHostnames(source);

  let status: TurnstileIntegrationStatus = "NOT_CONFIGURED";
  let sanitizedMessage: string | undefined;

  if (!siteKeyConfigured && !secretKeyConfigured) {
    status = "NOT_CONFIGURED";
    sanitizedMessage = "Site Key e Secret Key ausentes.";
  } else if (!secretKeyConfigured) {
    status = "INVALID_SECRET";
    sanitizedMessage = "Secret Key ausente ou inválida.";
  } else if (!siteKeyConfigured) {
    status = "NOT_CONFIGURED";
    sanitizedMessage = "Site Key ausente.";
  } else if (!enabled) {
    status = "DISABLED";
    sanitizedMessage = "Integração desabilitada (TURNSTILE_ENABLED).";
  } else {
    status = "ACTIVE";
    sanitizedMessage = "Turnstile configurado e habilitado.";
  }

  return {
    provider: "cloudflare_turnstile",
    configured,
    enabled,
    siteKeyConfigured,
    secretKeyConfigured,
    environment,
    allowedHostnames,
    status,
    sanitizedMessage,
  };
}

export { maskSiteKey };
