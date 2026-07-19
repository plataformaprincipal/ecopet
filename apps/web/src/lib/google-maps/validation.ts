import type { LatLng, StructuredAddress } from "./types";
import { MAX_GEOCODE_QUERY_LENGTH, NEARBY_RADIUS_OPTIONS_KM } from "./config";

export function isValidLatitude(lat: unknown): lat is number {
  return typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng: unknown): lng is number {
  return typeof lng === "number" && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function isValidLatLng(value: Partial<LatLng> | null | undefined): value is LatLng {
  return Boolean(value && isValidLatitude(value.lat) && isValidLongitude(value.lng));
}

export function parseLatLng(lat: unknown, lng: unknown): LatLng | null {
  const a = typeof lat === "string" ? Number(lat) : lat;
  const b = typeof lng === "string" ? Number(lng) : lng;
  if (!isValidLatitude(a) || !isValidLongitude(b)) return null;
  return { lat: a, lng: b };
}

export function clampRadiusKm(raw: unknown, fallback = 10): number {
  const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : fallback;
  if (!Number.isFinite(n) || n <= 0) return fallback;
  const allowed = NEARBY_RADIUS_OPTIONS_KM as readonly number[];
  if (allowed.includes(n)) return n;
  return Math.min(50, Math.max(1, Math.round(n)));
}

export function sanitizeGeocodeQuery(query: string): string | null {
  const trimmed = query.trim().replace(/\s+/g, " ").slice(0, MAX_GEOCODE_QUERY_LENGTH);
  if (trimmed.length < 3) return null;
  if (/^(https?:|javascript:|data:)/i.test(trimmed)) return null;
  return trimmed;
}

/** Arredonda ~3 casas (~110m) para privacidade aproximada. */
export function approximateCoordinates(lat: number, lng: number): LatLng {
  return {
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round(lng * 1000) / 1000,
  };
}

export function hasMinimumManualAddress(addr: Partial<StructuredAddress>): boolean {
  return Boolean(
    addr.street?.trim() &&
      addr.city?.trim() &&
      addr.state?.trim() &&
      (addr.postalCode?.replace(/\D/g, "").length === 8 || addr.number?.trim())
  );
}

export function buildGoogleMapsExternalUrl(destination: LatLng, origin?: LatLng | null): string {
  const dest = `${destination.lat},${destination.lng}`;
  if (origin && isValidLatLng(origin)) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${dest}`;
}
