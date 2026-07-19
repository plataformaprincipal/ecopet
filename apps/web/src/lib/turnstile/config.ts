/**
 * Configuração pública Turnstile (segura para Client Components).
 * Nunca referencie a Secret Key neste arquivo — ver `server-config.ts`.
 */

import type { TurnstilePublicConfig } from "./types";

export type { TurnstileEnvironment, TurnstilePublicConfig } from "./types";

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

export function isTurnstileSiteKeyConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  const key = env("NEXT_PUBLIC_TURNSTILE_SITE_KEY", source);
  return Boolean(key && !isPlaceholder(key));
}

/**
 * Flag pública: Site Key presente e TURNSTILE_ENABLED !== false.
 * A validação real no servidor ainda exige a Secret Key (server-config).
 */
export function isTurnstileEnabled(source: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env("TURNSTILE_ENABLED", source)?.toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off" || flag === "disabled") {
    return false;
  }
  return isTurnstileSiteKeyConfigured(source);
}

export function getTurnstilePublicConfig(
  source: NodeJS.ProcessEnv = process.env
): TurnstilePublicConfig {
  const siteKey = env("NEXT_PUBLIC_TURNSTILE_SITE_KEY", source) ?? "";
  const configured = isTurnstileSiteKeyConfigured(source);
  return {
    siteKey: configured ? siteKey : "",
    enabled: isTurnstileEnabled(source),
    configured,
  };
}

/** Máscara parcial da Site Key para admin (nunca Secret). */
export function maskSiteKey(siteKey: string | undefined): string {
  if (!siteKey) return "(não configurada)";
  if (siteKey.length <= 8) return "••••••••";
  return `${siteKey.slice(0, 4)}…${siteKey.slice(-4)}`;
}
