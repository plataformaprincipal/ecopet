/**
 * Configuração pública GA4 — apenas NEXT_PUBLIC_GA_MEASUREMENT_ID.
 * Nunca hardcode o Measurement ID.
 */

import type { AnalyticsEnvironment, AnalyticsSanitizedStatus, ConsentSettings } from "./types";

const GA_ID_RE = /^G-[A-Z0-9]+$/i;

function env(key: string, source: NodeJS.ProcessEnv = process.env): string | undefined {
  const v = source[key]?.trim();
  return v || undefined;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v.includes("xxxxxxxx") ||
    v.includes("your_") ||
    v.includes("changeme") ||
    v === "g-xxxxxxxxxx" ||
    v === "g-xxx"
  );
}

export function getGaMeasurementId(source: NodeJS.ProcessEnv = process.env): string | null {
  const id = env("NEXT_PUBLIC_GA_MEASUREMENT_ID", source);
  if (!id || isPlaceholder(id)) return null;
  if (!GA_ID_RE.test(id)) return null;
  return id;
}

export function isValidGaMeasurementId(id: string | null | undefined): boolean {
  return Boolean(id && GA_ID_RE.test(id) && !isPlaceholder(id));
}

export function maskMeasurementId(id: string | null | undefined): string | null {
  if (!id || id.length < 6) return null;
  return `${id.slice(0, 3)}***${id.slice(-2)}`;
}

export function detectAnalyticsEnvironment(
  source: NodeJS.ProcessEnv = process.env
): AnalyticsEnvironment {
  if (source.NODE_ENV === "test") return "test";
  const vercel = env("VERCEL_ENV", source);
  if (vercel === "production") return "production";
  if (vercel === "preview") return "preview";
  if (source.NODE_ENV === "production") return "production";
  if (source.NODE_ENV === "development") return "development";
  return "unknown";
}

/** Debug opcional: NEXT_PUBLIC_GA_DEBUG=1 */
export function isGaDebugEnabled(source: NodeJS.ProcessEnv = process.env): boolean {
  const v = env("NEXT_PUBLIC_GA_DEBUG", source)?.toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/**
 * Envio real ao Google:
 * - production: sim (se ID válido)
 * - preview: somente se NEXT_PUBLIC_GA_ENABLE_PREVIEW=1
 * - development: somente se NEXT_PUBLIC_GA_ENABLE_DEV=1
 */
export function shouldSendToGoogle(source: NodeJS.ProcessEnv = process.env): boolean {
  if (!getGaMeasurementId(source)) return false;
  const disabled = env("NEXT_PUBLIC_GA_ENABLED", source)?.toLowerCase();
  if (disabled === "false" || disabled === "0" || disabled === "off") return false;

  const environment = detectAnalyticsEnvironment(source);
  if (environment === "production") return true;
  if (environment === "preview") {
    const flag = env("NEXT_PUBLIC_GA_ENABLE_PREVIEW", source)?.toLowerCase();
    return flag === "1" || flag === "true";
  }
  if (environment === "development") {
    const flag = env("NEXT_PUBLIC_GA_ENABLE_DEV", source)?.toLowerCase();
    return flag === "1" || flag === "true";
  }
  return false;
}

export function isGaConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getGaMeasurementId(source));
}

/**
 * Consent Mode v2 defaults.
 * Por padrão: analytics/ads denied até consentimento explícito (LGPD-ready).
 * Override: NEXT_PUBLIC_GA_CONSENT_DEFAULT=granted (somente analytics_storage).
 */
export function getDefaultConsentSettings(
  source: NodeJS.ProcessEnv = process.env
): ConsentSettings {
  const raw = env("NEXT_PUBLIC_GA_CONSENT_DEFAULT", source)?.toLowerCase();
  const analyticsGranted = raw === "granted" || raw === "analytics_granted";
  return {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  };
}

export function getAnalyticsSanitizedStatus(
  source: NodeJS.ProcessEnv = process.env
): AnalyticsSanitizedStatus {
  const raw = env("NEXT_PUBLIC_GA_MEASUREMENT_ID", source);
  const id = getGaMeasurementId(source);
  const environment = detectAnalyticsEnvironment(source);
  const sendToGoogle = shouldSendToGoogle(source);
  const debug = isGaDebugEnabled(source);
  const consentDefault = getDefaultConsentSettings(source);

  let status: AnalyticsSanitizedStatus["status"] = "MISSING";
  if (raw && !id) status = "INVALID_ID";
  else if (!id) status = "MISSING";
  else if (!sendToGoogle && environment === "development") status = "DEV_ONLY";
  else if (!sendToGoogle) status = "DISABLED";
  else status = "READY";

  return {
    configured: Boolean(id),
    enabled: sendToGoogle,
    measurementIdMasked: maskMeasurementId(id),
    environment,
    sendToGoogle,
    debug,
    consentDefault,
    status,
    sanitizedMessage:
      status === "READY"
        ? "GA4 pronto para envio (produção/preview habilitado)."
        : status === "DEV_ONLY"
          ? "ID configurado, mas envio desabilitado em development (use NEXT_PUBLIC_GA_ENABLE_DEV=1 para debug)."
          : status === "DISABLED"
            ? "GA4 desabilitado por flag de ambiente."
            : status === "INVALID_ID"
              ? "Measurement ID inválido (esperado G-XXXX)."
              : "NEXT_PUBLIC_GA_MEASUREMENT_ID ausente.",
  };
}

/** Rotas que nunca devem gerar page_view (admin / API / internos). */
export const ANALYTICS_EXCLUDED_PATH_PREFIXES = [
  "/admin",
  "/api",
  "/gestor",
  "/_next",
  "/login",
  "/register",
  "/auth",
] as const;

export function isAnalyticsExcludedPath(path: string): boolean {
  const p = path.split("?")[0] || "/";
  return ANALYTICS_EXCLUDED_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`)
  );
}
