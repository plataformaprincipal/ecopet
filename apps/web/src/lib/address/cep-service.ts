import type { AddressByCepValue, CepLookupResult, ViaCepResponse } from "./types";

const CEP_CACHE_KEY = "ecopet_cep_cache_v1";
const memoryCache = new Map<string, Partial<AddressByCepValue>>();

export function normalizeCep(input: string): string {
  return input.replace(/\D/g, "").slice(0, 8);
}

export function formatCepDisplay(cep: string): string {
  const d = normalizeCep(cep);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function isValidCepFormat(cep: string): boolean {
  return /^\d{8}$/.test(normalizeCep(cep));
}

function readStorageCache(): Record<string, Partial<AddressByCepValue>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CEP_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Partial<AddressByCepValue>>) : {};
  } catch {
    return {};
  }
}

function writeStorageCache(data: Record<string, Partial<AddressByCepValue>>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CEP_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function getCachedCep(cep: string): Partial<AddressByCepValue> | null {
  const key = normalizeCep(cep);
  if (!key) return null;
  if (memoryCache.has(key)) return memoryCache.get(key)!;
  const stored = readStorageCache()[key];
  if (stored) {
    memoryCache.set(key, stored);
    return stored;
  }
  return null;
}

export function setCachedCep(cep: string, address: Partial<AddressByCepValue>) {
  const key = normalizeCep(cep);
  if (!key) return;
  memoryCache.set(key, address);
  const stored = readStorageCache();
  stored[key] = address;
  writeStorageCache(stored);
}

export function parseViaCepResponse(data: ViaCepResponse): Partial<AddressByCepValue> | null {
  if (data.erro || !data.localidade) return null;
  return {
    zipCode: formatCepDisplay(normalizeCep(data.cep ?? "")),
    street: data.logradouro ?? "",
    district: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
    complement: data.complemento ?? "",
  };
}

export async function fetchViaCep(cep: string, signal?: AbortSignal): Promise<Partial<AddressByCepValue> | null> {
  const normalized = normalizeCep(cep);
  if (!isValidCepFormat(normalized)) return null;

  const res = await fetch(`https://viacep.com.br/ws/${normalized}/json/`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Falha ao consultar CEP. Verifique sua conexão.");
  const data = (await res.json()) as ViaCepResponse;
  return parseViaCepResponse(data);
}

export async function geocodeAddress(params: {
  street: string;
  number?: string;
  city: string;
  state: string;
  district?: string;
}): Promise<{ latitude: number; longitude: number } | null> {
  const parts = [params.street, params.number, params.district, params.city, params.state, "Brasil"].filter(Boolean);
  const q = encodeURIComponent(parts.join(", "));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "ECOPET-Platform/1.0 (address-geocoding)",
        },
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { lat: string; lon: string }[];
    if (!json[0]) return null;
    return { latitude: parseFloat(json[0].lat), longitude: parseFloat(json[0].lon) };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function lookupCep(cep: string): Promise<CepLookupResult> {
  const normalized = normalizeCep(cep);
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();

  if (!isValidCepFormat(normalized)) {
    return { ok: false, fromCache: false, error: "CEP inválido. Informe 8 dígitos." };
  }

  const cached = getCachedCep(normalized);
  if (cached) {
    const durationMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - started);
    logCepLookup(normalized, cached, durationMs, true);
    return { ok: true, fromCache: true, address: cached, durationMs };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const parsed = await fetchViaCep(normalized, controller.signal);
    if (!parsed) {
      return { ok: false, fromCache: false, error: "CEP não encontrado. Preencha o endereço manualmente." };
    }

    let withGeo: Partial<AddressByCepValue> = { ...parsed };
    if (parsed.street && parsed.city && parsed.state) {
      const geo = await geocodeAddress({
        street: parsed.street,
        city: parsed.city,
        state: parsed.state,
        district: parsed.district,
      });
      if (geo) {
        withGeo = { ...withGeo, latitude: geo.latitude, longitude: geo.longitude };
      }
    }

    setCachedCep(normalized, withGeo);
    const durationMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - started);
    logCepLookup(normalized, withGeo, durationMs, false);
    return { ok: true, fromCache: false, address: withGeo, durationMs };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      fromCache: false,
      error: isAbort
        ? "Tempo esgotado ao consultar CEP. Tente novamente ou preencha manualmente."
        : "Erro de conexão. Verifique a internet e tente novamente.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function logCepLookup(
  cep: string,
  address: Partial<AddressByCepValue>,
  durationMs: number,
  fromCache: boolean
) {
  if (typeof console === "undefined") return;
  console.log("[ECOPET CEP] CEP consultado:", formatCepDisplay(cep), fromCache ? "(cache)" : "");
  console.log("[ECOPET CEP] Endereço encontrado:", {
    street: address.street,
    district: address.district,
    city: address.city,
    state: address.state,
    latitude: address.latitude,
    longitude: address.longitude,
  });
  console.log("[ECOPET CEP] Tempo da consulta:", `${durationMs}ms`);
}

export function mergeAddress(current: AddressByCepValue, patch: Partial<AddressByCepValue>): AddressByCepValue {
  return {
    ...current,
    ...patch,
    number: patch.number ?? current.number,
    complement: patch.complement ?? current.complement,
    reference: patch.reference ?? current.reference,
  };
}
