/**
 * Configuração pública Google Maps.
 * Preferência: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (browser).
 * Fallback server-only: GOOGLE_MAPS_API_KEY (nunca exportar para client bundles via server.ts).
 */

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
    v === "xxx" ||
    v.startsWith("aizasyxxxxx")
  );
}

/** Chave web pública — segura para Client Components (protegida por restrição de domínio no GCP). */
export function getGoogleMapsPublicApiKey(source: NodeJS.ProcessEnv = process.env): string | null {
  const key = env("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", source);
  if (!key || isPlaceholder(key)) return null;
  return key;
}

export function isGoogleMapsPublicConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getGoogleMapsPublicApiKey(source));
}

/** Indica se Maps JS pode ser carregado no browser. */
export function isGoogleMapsClientReady(source: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env("GOOGLE_MAPS_ENABLED", source)?.toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off" || flag === "disabled") return false;
  return isGoogleMapsPublicConfigured(source);
}

export function maskApiKeyHint(key: string | null | undefined): string | null {
  if (!key || key.length < 8) return null;
  return `${key.slice(0, 4)}…${key.slice(-3)}`;
}

export const GOOGLE_MAPS_LIBRARIES = ["places", "geometry", "marker"] as const;

export const DEFAULT_MAP_CENTER = { lat: -23.5505, lng: -46.6333 }; // São Paulo
export const DEFAULT_MAP_ZOOM = 14;
export const NEARBY_RADIUS_OPTIONS_KM = [2, 5, 10, 20, 50] as const;
export const MAX_GEOCODE_QUERY_LENGTH = 300;
