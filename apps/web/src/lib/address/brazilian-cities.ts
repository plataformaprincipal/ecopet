const IBGE_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; cities: string[] }>();

export async function fetchCitiesByUf(uf: string, signal?: AbortSignal): Promise<string[]> {
  const state = uf.trim().toUpperCase();
  if (state.length !== 2) return [];

  const hit = cache.get(state);
  if (hit && Date.now() - hit.at < IBGE_CACHE_TTL_MS) return hit.cities;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );
    if (!res.ok) return hit?.cities ?? [];
    const data = (await res.json()) as Array<{ nome?: string }>;
    const cities = data
      .map((row) => (typeof row.nome === "string" ? row.nome.trim() : ""))
      .filter(Boolean);
    cache.set(state, { at: Date.now(), cities });
    return cities;
  } catch {
    return hit?.cities ?? [];
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}

export function filterCities(cities: string[], query: string, limit = 12): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return cities.slice(0, limit);
  return cities.filter((c) => c.toLowerCase().includes(q)).slice(0, limit);
}
