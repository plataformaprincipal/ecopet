/**
 * Estado central de localização (Marketplace, e depois Serviços/Adoção/Lost Pet/Trends).
 * Reusa a mesma sessionStorage da IA (`ecopet:ai:geo`) para lat/lng.
 * Coordenadas precisas nunca vão para URL/HTML.
 */

import { clearStoredAiGeo, readStoredAiGeo, storeAiGeo } from "@/lib/ai/client-geo";
import { lookupCep } from "@/lib/address/cep-service";
import { geocodeAddress } from "@/lib/address/cep-service";

export type UserLocationState = "unknown" | "requesting" | "granted" | "denied" | "manual";

const META_KEY = "ecopet:location:meta";

export type UserLocationMeta = {
  state: UserLocationState;
  city?: string;
  stateUf?: string;
  cep?: string;
  label?: string;
  lat?: number;
  lng?: number;
};

function readMeta(): UserLocationMeta {
  if (typeof sessionStorage === "undefined") return { state: "unknown" };
  try {
    const raw = sessionStorage.getItem(META_KEY);
    if (!raw) return { state: "unknown" };
    const parsed = JSON.parse(raw) as UserLocationMeta;
    if (!parsed?.state) return { state: "unknown" };
    return parsed;
  } catch {
    return { state: "unknown" };
  }
}

function writeMeta(meta: UserLocationMeta) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function getUserLocationMeta(): UserLocationMeta {
  return readMeta();
}

export function getUserCoordinates(): { lat: number; lng: number } | null {
  const meta = readMeta();
  if (!locationIsKnown(meta.state)) return null;
  const geo = readStoredAiGeo();
  if (geo) return { lat: geo.lat, lng: geo.lng };
  if (meta.lat != null && meta.lng != null && Number.isFinite(meta.lat) && Number.isFinite(meta.lng)) {
    return { lat: meta.lat, lng: meta.lng };
  }
  return null;
}

export function locationIsKnown(state: UserLocationState): boolean {
  return state === "granted" || state === "manual";
}

export function locationNeedsPrompt(state: UserLocationState): boolean {
  return state === "unknown";
}

export function clearUserLocation(): void {
  clearStoredAiGeo();
  writeMeta({ state: "unknown" });
}

export function markLocationDenied(): void {
  writeMeta({ ...readMeta(), state: "denied" });
}

export async function requestBrowserLocation(): Promise<{
  state: UserLocationState;
  coords: { lat: number; lng: number } | null;
  reason?: string;
}> {
  writeMeta({ ...readMeta(), state: "requesting" });
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    writeMeta({ state: "denied" });
    return { state: "denied", coords: null, reason: "UNSUPPORTED" };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        storeAiGeo(coords.lat, coords.lng);
        writeMeta({ state: "granted", label: "GPS", lat: coords.lat, lng: coords.lng });
        resolve({ state: "granted", coords });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        writeMeta({ state: denied ? "denied" : "unknown" });
        resolve({
          state: denied ? "denied" : "unknown",
          coords: null,
          reason: denied ? "DENIED" : err.code === err.TIMEOUT ? "TIMEOUT" : "ERROR",
        });
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 }
    );
  });
}

export async function setManualLocationByCep(cep: string): Promise<{
  ok: boolean;
  city?: string;
  stateUf?: string;
  coords: { lat: number; lng: number } | null;
  error?: string;
}> {
  const result = await lookupCep(cep);
  if (!result.ok || !result.address) {
    return { ok: false, coords: null, error: result.error ?? "CEP inválido." };
  }
  const city = result.address.city;
  const stateUf = result.address.state;
  let coords: { lat: number; lng: number } | null = null;
  if (result.address.latitude != null && result.address.longitude != null) {
    coords = { lat: result.address.latitude, lng: result.address.longitude };
  } else if (city && stateUf) {
    const geo = await geocodeAddress({
      street: result.address.street || city,
      city,
      state: stateUf,
      district: result.address.district,
    });
    if (geo) coords = { lat: geo.latitude, lng: geo.longitude };
  }
  if (coords) storeAiGeo(coords.lat, coords.lng);
  writeMeta({
    state: "manual",
    city,
    stateUf,
    cep,
    label: [city, stateUf].filter(Boolean).join(" / "),
    lat: coords?.lat,
    lng: coords?.lng,
  });
  return { ok: true, city, stateUf, coords };
}

export async function setManualCity(city: string, stateUf?: string): Promise<{
  ok: boolean;
  coords: { lat: number; lng: number } | null;
}> {
  const geo = await geocodeAddress({ street: city, city, state: stateUf || "Brasil" });
  const coords = geo ? { lat: geo.latitude, lng: geo.longitude } : null;
  if (coords) storeAiGeo(coords.lat, coords.lng);
  writeMeta({
    state: "manual",
    city,
    stateUf,
    label: [city, stateUf].filter(Boolean).join(" / "),
    lat: coords?.lat,
    lng: coords?.lng,
  });
  return { ok: Boolean(coords), coords };
}
