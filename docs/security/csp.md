# CSP EcoPet — notas de hardening

## Estado atual

CSP definida em `apps/web/src/lib/security/headers.ts` e aplicada via `next.config.ts`.

Diretivas sensíveis ainda presentes (necessárias):

| Diretiva | Motivo |
|----------|--------|
| `script-src 'unsafe-inline'` | Next.js + hidratação; VLibras injeta scripts |
| `script-src 'unsafe-eval'` | VLibras / Unity WebGL (WASM bridge) |
| `script-src 'wasm-unsafe-eval' blob:` | VLibras WebGL |
| `cdn.talkjs.com` / `api.talkjs.com` | TalkJS chat |
| `cdn.jsdelivr.net` | espelho oficial VLibras |
| `www.googletagmanager.com` / `*.google-analytics.com` | Google Analytics 4 (gtag) |
| `sdk.mercadopago.com` / `*.mercadopago.com*` | Checkout Mercado Pago |
| `res.cloudinary.com` / `api.cloudinary.com` | Mídia Cloudinary |
| `*.ingest.sentry.io` | Sentry (quando SDK ativo) |

## O que foi reduzido / documentado

- `frame-ancestors 'self'` e `base-uri 'self'` mantidos.
- `form-action 'self'` mantido.
- `upgrade-insecure-requests` só em produção.
- Sem `*` amplo em `script-src` além dos hosts VLibras/TalkJS.
- Service worker de push usa `worker-src 'self' blob:` (já permitido).

## O que NÃO remover sem QA dedicado

Remover `unsafe-inline` / `unsafe-eval` quebra VLibras e pode quebrar Next em runtime.
Plano futuro: nonces/hashes para scripts first-party + sandbox VLibras em iframe isolado.

## Fallback VLibras

Se a CDN falhar, a app não deve quebrar — o loader de acessibilidade trata falha com retry (ver `vlibras-load-outcome`).
