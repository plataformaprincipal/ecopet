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
 * O plugin oficial redireciona (302) para o espelho CDN gov.br em cdn.jsdelivr.net.
 */
const VLIBRAS_HOSTS =
  "https://vlibras.gov.br https://www.vlibras.gov.br https://*.vlibras.gov.br";
/** Espelho oficial do portal VLibras (redirect 302 de vlibras.gov.br/app/*). */
const VLIBRAS_CDN = "https://cdn.jsdelivr.net";

export function contentSecurityPolicy(): string {
  const isProd = process.env.NODE_ENV === "production";
  const vlibrasSources = `${VLIBRAS_HOSTS} ${VLIBRAS_CDN}`;
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${vlibrasSources} https://cdn.talkjs.com`,
    `style-src 'self' 'unsafe-inline' ${vlibrasSources}`,
    `img-src 'self' data: blob: https: http: ${VLIBRAS_HOSTS}`,
    "font-src 'self' data: https:",
    `connect-src 'self' https: wss: ${vlibrasSources} https://cdn.talkjs.com https://api.talkjs.com wss://*.talkjs.com`,
    `frame-src 'self' ${vlibrasSources} https://cdn.talkjs.com`,
    `worker-src 'self' blob: ${vlibrasSources}`,
    `child-src 'self' blob: ${vlibrasSources}`,
    `media-src 'self' blob: ${vlibrasSources}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (isProd) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
