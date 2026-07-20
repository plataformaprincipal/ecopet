/**
 * Cache abstrato para a camada de IA.
 * Implementação atual: memória in-process com TTL.
 * Preparado para Redis (mesma interface).
 */

export type AiCacheBackend = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlMs?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
};

type Entry = { value: unknown; expiresAt: number };

function createMemoryBackend(): AiCacheBackend {
  const store = new Map<string, Entry>();

  return {
    async get<T>(key: string) {
      const hit = store.get(key);
      if (!hit) return null;
      if (Date.now() > hit.expiresAt) {
        store.delete(key);
        return null;
      }
      return hit.value as T;
    },
    async set(key, value, ttlMs = 60_000) {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    async del(key) {
      store.delete(key);
    },
    async clear() {
      store.clear();
    },
  };
}

let backend: AiCacheBackend = createMemoryBackend();

/** Troca o backend (ex.: Redis) sem alterar consumidores. */
export function setAiCacheBackend(next: AiCacheBackend): void {
  backend = next;
}

export function getAiCache(): AiCacheBackend {
  return backend;
}

export async function withAiCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const cached = await backend.get<T>(key);
  if (cached !== null) return cached;
  const value = await loader();
  await backend.set(key, value, ttlMs);
  return value;
}
