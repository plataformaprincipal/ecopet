/** Security headers aplicados via next.config.ts */

export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
] as const;

export function productionOnlyHeaders(): { key: string; value: string }[] {
  if (process.env.NODE_ENV !== "production") return [];
  return [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }];
}

/**
 * CSP compatível com Next.js e VLibras.
 * VLibras carrega scripts de vlibras.gov.br — exceção documentada em docs/security/web-security.md
 */
export function contentSecurityPolicy(): string {
  const isProd = process.env.NODE_ENV === "production";
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vlibras.gov.br https://www.vlibras.gov.br https://*.vlibras.gov.br",
    "style-src 'self' 'unsafe-inline' https://vlibras.gov.br https://www.vlibras.gov.br https://*.vlibras.gov.br",
    "img-src 'self' data: blob: https: http: https://vlibras.gov.br https://www.vlibras.gov.br https://*.vlibras.gov.br",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss: https://vlibras.gov.br https://www.vlibras.gov.br https://*.vlibras.gov.br",
    "frame-src 'self' https://vlibras.gov.br https://www.vlibras.gov.br https://*.vlibras.gov.br",
    "worker-src 'self' blob: https://vlibras.gov.br https://www.vlibras.gov.br https://*.vlibras.gov.br",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (isProd) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
