/**
 * URL base e composição de rotas — evita /api/ecopet/api/* duplicado.
 */
export const PROXY_PREFIX = "/api/ecopet";

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

/** Client-side: proxy same-origin. Server-side RSC: env ou proxy. */
export function getClientApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL);
  }
  return PROXY_PREFIX;
}

/**
 * Monta a URL final do fetch.
 *
 * @param base - `/api/ecopet` (proxy) ou `http://localhost:4000` (API direta)
 * @param path - rota com prefixo `/api/...` (ex: `/api/auth/login`)
 *
 * Proxy:  `/api/auth/login` → `/api/ecopet/auth/login` → backend `/api/auth/login`
 * Direto: `http://localhost:4000` + `/api/auth/login`
 */
export function buildApiUrl(base: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (base === PROXY_PREFIX || base.endsWith(PROXY_PREFIX)) {
    const relative = normalizedPath.replace(/^\/api/, "") || "/";
    return `${PROXY_PREFIX}${relative}`;
  }

  return `${stripTrailingSlash(base)}${normalizedPath}`;
}

/** Normaliza segmentos recebidos pelo proxy (remove `api` duplicado). */
export function normalizeProxySegments(segments: string[]): string[] {
  if (segments.length > 0 && segments[0] === "api") {
    return segments.slice(1);
  }
  return segments;
}
