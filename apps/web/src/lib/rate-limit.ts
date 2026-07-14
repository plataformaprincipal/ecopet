type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

/** Limpa buckets in-memory — uso em testes (nunca afeta produção multi-instância). */
export function resetRateLimitStore(prefix?: string): number {
  if (!prefix) {
    const size = store.size;
    store.clear();
    return size;
  }
  let removed = 0;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      removed += 1;
    }
  }
  return removed;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const force = process.env.RATE_LIMIT_FORCE === "1";
  if (process.env.NODE_ENV !== "production" && !force) {
    return true;
  }
  return consumeRateLimit(key, limit, windowMs);
}

/** Rate limit para autenticação — ativo em todos os ambientes */
export function checkAuthRateLimit(key: string, limit: number, windowMs: number): boolean {
  if (process.env.AUTH_RATE_LIMIT_DISABLED === "1") {
    return true;
  }
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

function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.trim();
  if (!ip) return null;
  // IPv6 entre colchetes com porta: [::1]:443
  const bracket = ip.match(/^\[(.+)\]:\d+$/);
  if (bracket) return bracket[1];
  // IPv4 com porta: 1.2.3.4:5678 (não confundir com IPv6 puro, que tem múltiplos ":")
  if (ip.includes(".") && ip.includes(":")) {
    ip = ip.split(":")[0];
  }
  return ip || null;
}

/**
 * Resolve o IP do cliente confiando na cadeia de proxy da Vercel.
 * Em produção atrás da Vercel, o IP real é o PRIMEIRO valor de x-forwarded-for
 * (injetado pela borda), portanto usamos a posição mais à esquerda.
 */
export function clientIp(request: Request): string {
  const headers = request.headers;
  const vercel = normalizeIp(headers.get("x-vercel-forwarded-for"));
  if (vercel) return vercel;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = normalizeIp(forwarded.split(",")[0]);
    if (first) return first;
  }

  const real = normalizeIp(headers.get("x-real-ip"));
  return real ?? "unknown";
}
