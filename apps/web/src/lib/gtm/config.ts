/**
 * Configuração pública GTM — apenas NEXT_PUBLIC_GTM_ID.
 * Nunca hardcode o Container ID.
 */
import type { GtmEnvironment, GtmSanitizedStatus } from "./types";

function env(name: string, source: NodeJS.ProcessEnv = process.env): string | undefined {
  const v = source[name];
  return typeof v === "string" ? v.trim() : undefined;
}

/** GTM-XXXXXXX (mín. 6 chars alfanum após prefixo). */
export function isValidGtmContainerId(id: string | null | undefined): boolean {
  if (!id) return false;
  if (/^GTM-X+$/i.test(id)) return false;
  return /^GTM-[A-Z0-9]{4,12}$/i.test(id);
}

export function maskGtmContainerId(id: string | null | undefined): string | null {
  if (!id || !isValidGtmContainerId(id)) return null;
  const body = id.slice(4);
  if (body.length <= 3) return `GTM-${body[0]}***`;
  return `GTM-${body[0]}***${body.slice(-2)}`;
}

export function detectGtmEnvironment(source: NodeJS.ProcessEnv = process.env): GtmEnvironment {
  if (source.NODE_ENV === "test") return "test";
  const vercel = env("VERCEL_ENV", source);
  if (vercel === "production") return "production";
  if (vercel === "preview") return "preview";
  if (vercel === "development") return "development";
  if (source.NODE_ENV === "production") return "production";
  if (source.NODE_ENV === "development") return "development";
  return "unknown";
}

export function getGtmContainerId(source: NodeJS.ProcessEnv = process.env): string | null {
  const raw = env("NEXT_PUBLIC_GTM_ID", source);
  if (!raw || !isValidGtmContainerId(raw)) return null;
  return raw.toUpperCase();
}

export function isGtmConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getGtmContainerId(source));
}

export function isGtmDebugEnabled(source: NodeJS.ProcessEnv = process.env): boolean {
  const v = env("NEXT_PUBLIC_GTM_DEBUG", source)?.toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Carrega container:
 * - production: default on (se ID válido)
 * - preview: NEXT_PUBLIC_GTM_ENABLE_PREVIEW=1
 * - development: NEXT_PUBLIC_GTM_ENABLE_DEV=1
 * Kill-switch: NEXT_PUBLIC_GTM_ENABLED=false
 */
export function shouldLoadGtm(source: NodeJS.ProcessEnv = process.env): boolean {
  const disabled = env("NEXT_PUBLIC_GTM_ENABLED", source)?.toLowerCase();
  if (disabled === "0" || disabled === "false" || disabled === "off") return false;
  if (!getGtmContainerId(source)) return false;

  const environment = detectGtmEnvironment(source);
  if (environment === "production") return true;
  if (environment === "preview") {
    const flag = env("NEXT_PUBLIC_GTM_ENABLE_PREVIEW", source)?.toLowerCase();
    return flag === "1" || flag === "true";
  }
  if (environment === "development" || environment === "unknown") {
    const flag = env("NEXT_PUBLIC_GTM_ENABLE_DEV", source)?.toLowerCase();
    return flag === "1" || flag === "true";
  }
  return false;
}

export function getGtmSanitizedStatus(source: NodeJS.ProcessEnv = process.env): GtmSanitizedStatus {
  const raw = env("NEXT_PUBLIC_GTM_ID", source);
  const id = getGtmContainerId(source);
  const environment = detectGtmEnvironment(source);
  const loadContainer = shouldLoadGtm(source);
  const antiDuplicationNote =
    "Eventos EcoPet vão ao GA4 via gtag; GTM recebe espelho namespaced (ecopet_*). Não ative tags GA4 de page_view/event no container se o provider EcoPet já envia.";

  if (!raw) {
    return {
      configured: false,
      enabled: false,
      containerIdMasked: null,
      environment,
      loadContainer: false,
      debug: isGtmDebugEnabled(source),
      status: "MISSING",
      sanitizedMessage: "NEXT_PUBLIC_GTM_ID ausente.",
      antiDuplicationNote,
    };
  }
  if (!id) {
    return {
      configured: false,
      enabled: false,
      containerIdMasked: null,
      environment,
      loadContainer: false,
      debug: isGtmDebugEnabled(source),
      status: "INVALID_ID",
      sanitizedMessage: "Container ID inválido (esperado GTM-XXXX).",
      antiDuplicationNote,
    };
  }
  if (!loadContainer) {
    const status =
      environment === "development" || environment === "preview" ? "DEV_ONLY" : "DISABLED";
    return {
      configured: true,
      enabled: false,
      containerIdMasked: maskGtmContainerId(id),
      environment,
      loadContainer: false,
      debug: isGtmDebugEnabled(source),
      status,
      sanitizedMessage:
        status === "DEV_ONLY"
          ? "Container configurado, mas carga desabilitada neste ambiente (use NEXT_PUBLIC_GTM_ENABLE_DEV/PREVIEW=1)."
          : "GTM desabilitado (NEXT_PUBLIC_GTM_ENABLED=false).",
      antiDuplicationNote,
    };
  }
  return {
    configured: true,
    enabled: true,
    containerIdMasked: maskGtmContainerId(id),
    environment,
    loadContainer: true,
    debug: isGtmDebugEnabled(source),
    status: "READY",
    sanitizedMessage: "GTM pronto para carregar o container.",
    antiDuplicationNote,
  };
}
