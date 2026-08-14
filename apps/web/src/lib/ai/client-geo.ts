"use client";

/** Geo temporária para consultas near-me via IA — nunca persistida no servidor. */
const STORAGE_KEY = "ecopet:ai:geo";
const MAX_AGE_MS = 5 * 60_000;

export type StoredAiGeo = {
  lat: number;
  lng: number;
  ts: number;
};

export function storeAiGeo(lat: number, lng: number): void {
  if (typeof sessionStorage === "undefined") return;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ lat, lng, ts: Date.now() } satisfies StoredAiGeo)
  );
}

export function readStoredAiGeo(): StoredAiGeo | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAiGeo;
    if (!parsed || !Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredAiGeo(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Solicita geolocalização do navegador — somente após ação explícita do usuário. */
export function requestBrowserGeo(): Promise<{ ok: boolean; reason?: string }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ ok: false, reason: "UNSUPPORTED" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        storeAiGeo(pos.coords.latitude, pos.coords.longitude);
        resolve({ ok: true });
      },
      (err) => {
        const reason =
          err.code === err.PERMISSION_DENIED
            ? "DENIED"
            : err.code === err.TIMEOUT
              ? "TIMEOUT"
              : "ERROR";
        resolve({ ok: false, reason });
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 }
    );
  });
}

export function geoPayloadForRequest(): { lat?: number; lng?: number } {
  const geo = readStoredAiGeo();
  if (!geo) return {};
  return { lat: geo.lat, lng: geo.lng };
}
