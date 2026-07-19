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
 * CSP compatível com Next.js, VLibras e TalkJS.
 * Ver docs/security/csp.md — unsafe-inline/unsafe-eval ainda necessários para VLibras/WASM.
 * Não remover essas exceções sem QA de acessibilidade + chat.
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
    // TalkJS + VLibras: hosts explícitos; sem wildcard genérico de terceiros
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: ${vlibrasSources} https://cdn.talkjs.com https://maps.googleapis.com https://maps.gstatic.com`,
    `style-src 'self' 'unsafe-inline' ${vlibrasSources} https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https: ${VLIBRAS_HOSTS} https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://*.googleusercontent.com`,
    "font-src 'self' data: https: https://fonts.gstatic.com",
    `connect-src 'self' https: wss: ${vlibrasSources} https://cdn.talkjs.com https://api.talkjs.com wss://*.talkjs.com https://maps.googleapis.com https://places.googleapis.com`,
    `frame-src 'self' ${vlibrasSources} https://cdn.talkjs.com`,
    `worker-src 'self' blob: ${vlibrasSources}`,
    `child-src 'self' blob: ${vlibrasSources}`,
    `media-src 'self' blob: ${vlibrasSources}`,
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (isProd) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
