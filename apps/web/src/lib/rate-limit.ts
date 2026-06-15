type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const force = process.env.RATE_LIMIT_FORCE === "1";
  if (process.env.NODE_ENV !== "production" && !force) {
    return true;
  }
  return consumeRateLimit(key, limit, windowMs);
}

/** Rate limit para autenticação — ativo em todos os ambientes */
export function checkAuthRateLimit(key: string, limit: number, windowMs: number): boolean {
  const relaxed = process.env.AUTH_RATE_LIMIT_RELAXED === "1";
  const effectiveLimit = relaxed ? 500 : limit;
  return consumeRateLimit(key, effectiveLimit, windowMs);
}

function consumeRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}
