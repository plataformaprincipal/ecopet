import "server-only";

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();
let hits = 0;
let misses = 0;

export function analyticsCacheGet<T>(key: string): T | undefined {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) {
    hits += 1;
    return hit.value;
  }
  if (hit) store.delete(key);
  misses += 1;
  return undefined;
}

export function analyticsCacheSet<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function withAnalyticsCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const cached = analyticsCacheGet<T>(key);
  if (cached !== undefined) return cached;
  const value = await loader();
  analyticsCacheSet(key, value, ttlMs);
  return value;
}

export function clearAnalyticsCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return { cleared: true, size: 0 };
  }
  let n = 0;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      n += 1;
    }
  }
  return { cleared: true, removed: n, size: store.size };
}

export function analyticsCacheStats() {
  return { hits, misses, size: store.size };
}
