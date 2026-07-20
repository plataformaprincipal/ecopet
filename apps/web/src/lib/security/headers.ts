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
 * CSP compatível com Next.js, VLibras, TalkJS, Maps, GTM e GA4.
 * Ver docs/security/csp.md — unsafe-inline/unsafe-eval ainda necessários para VLibras/WASM.
 * Não remover essas exceções sem QA de acessibilidade + chat.
 */
const VLIBRAS_HOSTS =
  "https://vlibras.gov.br https://www.vlibras.gov.br https://*.vlibras.gov.br";
/** Espelho oficial do portal VLibras (redirect 302 de vlibras.gov.br/app/*). */
const VLIBRAS_CDN = "https://cdn.jsdelivr.net";
/** Google Tag Manager + Google Analytics 4 / gtag.js. */
const GA_HOSTS =
  "https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com";
/** Mercado Pago Checkout Bricks / SDK v2. */
const MP_HOSTS =
  "https://sdk.mercadopago.com https://www.mercadopago.com https://www.mercadopago.com.br https://*.mercadopago.com https://*.mercadopago.com.br https://http2.mlstatic.com";
/** Cloudinary (uploads / media). */
const CLOUDINARY_HOSTS = "https://res.cloudinary.com https://api.cloudinary.com https://upload.cloudinary.com";
/** Sentry browser ingest (quando SDK for ligado). */
const SENTRY_HOSTS = "https://*.ingest.sentry.io https://*.sentry.io";

export function contentSecurityPolicy(): string {
  const isProd = process.env.NODE_ENV === "production";
  const vlibrasSources = `${VLIBRAS_HOSTS} ${VLIBRAS_CDN}`;
  const directives = [
    "default-src 'self'",
    // TalkJS + VLibras + Maps + GA4 + Mercado Pago
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: ${vlibrasSources} https://cdn.talkjs.com https://maps.googleapis.com https://maps.gstatic.com ${GA_HOSTS} ${MP_HOSTS}`,
    `style-src 'self' 'unsafe-inline' ${vlibrasSources} https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https: ${VLIBRAS_HOSTS} https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://*.googleusercontent.com ${GA_HOSTS} ${CLOUDINARY_HOSTS} ${MP_HOSTS}`,
    "font-src 'self' data: https: https://fonts.gstatic.com",
    `connect-src 'self' https: wss: ${vlibrasSources} https://cdn.talkjs.com https://api.talkjs.com wss://*.talkjs.com https://maps.googleapis.com https://places.googleapis.com ${GA_HOSTS} ${MP_HOSTS} ${CLOUDINARY_HOSTS} ${SENTRY_HOSTS}`,
    `frame-src 'self' ${vlibrasSources} https://cdn.talkjs.com https://www.googletagmanager.com ${MP_HOSTS}`,
    `worker-src 'self' blob: ${vlibrasSources}`,
    `child-src 'self' blob: ${vlibrasSources}`,
    `media-src 'self' blob: ${vlibrasSources} ${CLOUDINARY_HOSTS}`,
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (isProd) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
