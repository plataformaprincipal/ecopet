type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

/** Rate limit social — sempre ativo (inclui testes). */
export function checkSocialRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function resetSocialRateLimits() {
  store.clear();
}
