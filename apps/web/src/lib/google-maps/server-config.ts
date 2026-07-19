import "server-only";

import {
  getGoogleMapsPublicApiKey,
  isGoogleMapsClientReady,
  isGoogleMapsPublicConfigured,
} from "./config";
import type { GoogleMapsSanitizedStatus } from "./types";

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

/**
 * Chave para Geocoding/Directions REST no servidor.
 * Preferência: GOOGLE_MAPS_API_KEY; fallback: NEXT_PUBLIC_* (mesmo projeto).
 */
export function getGoogleMapsServerApiKey(source: NodeJS.ProcessEnv = process.env): string | null {
  const server = env("GOOGLE_MAPS_API_KEY", source);
  if (server && !isPlaceholder(server)) return server;
  return getGoogleMapsPublicApiKey(source);
}

export function isGoogleMapsServerConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getGoogleMapsServerApiKey(source));
}

export function getGoogleMapsSanitizedStatus(
  source: NodeJS.ProcessEnv = process.env
): GoogleMapsSanitizedStatus {
  const publicKeyConfigured = isGoogleMapsPublicConfigured(source);
  const serverKeyConfigured = isGoogleMapsServerConfigured(source);
  const configured = publicKeyConfigured || serverKeyConfigured;

  const flag = env("GOOGLE_MAPS_ENABLED", source)?.toLowerCase();
  let status: GoogleMapsSanitizedStatus["status"] = "MISSING";
  if (flag === "false" || flag === "0" || flag === "off") status = "DISABLED";
  else if (publicKeyConfigured && serverKeyConfigured) status = "READY";
  else if (configured) status = "PARTIAL";

  const nodeEnv = env("NODE_ENV", source);
  const vercelEnv = env("VERCEL_ENV", source);
  const environment =
    vercelEnv === "production" || nodeEnv === "production"
      ? "production"
      : vercelEnv === "preview"
        ? "preview"
        : nodeEnv === "development"
          ? "development"
          : "unknown";

  return {
    configured,
    publicKeyConfigured,
    serverKeyConfigured,
    environment,
    status,
    sanitizedMessage:
      status === "READY"
        ? "Google Maps configurado (cliente + servidor)."
        : status === "PARTIAL"
          ? "Configuração parcial — defina NEXT_PUBLIC_GOOGLE_MAPS_API_KEY e/ou GOOGLE_MAPS_API_KEY."
          : status === "DISABLED"
            ? "Google Maps desabilitado por flag."
            : "Chave Google Maps ausente.",
    expectedApis: [
      "Maps JavaScript API",
      "Places API",
      "Geocoding API",
      "Directions API",
      "Distance Matrix API (opcional)",
    ],
  };
}

export function isGoogleMapsEnabled(source: NodeJS.ProcessEnv = process.env): boolean {
  return isGoogleMapsClientReady(source) || isGoogleMapsServerConfigured(source);
}
