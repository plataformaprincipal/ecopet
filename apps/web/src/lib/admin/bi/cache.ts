/** Cache em memória com TTL — evita consultas pesadas repetidas no Admin BI. */

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

export async function withBiCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = await loader();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function clearBiCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
