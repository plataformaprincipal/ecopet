type Entry<T> = { value: T; expiresAt: number };

let entry: Entry<unknown> | null = null;

export function gtmGovCacheGet<T>(key: string): T | undefined {
  if (!entry || entry.expiresAt < Date.now()) return undefined;
  const wrapped = entry.value as { key: string; data: T };
  if (wrapped.key !== key) return undefined;
  return wrapped.data;
}

export function gtmGovCacheSet<T>(key: string, data: T, ttlMs = 30_000) {
  entry = { value: { key, data }, expiresAt: Date.now() + ttlMs };
}

export function gtmGovCacheClear() {
  entry = null;
}
