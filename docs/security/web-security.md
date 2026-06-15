# Segurança Web — EcoPet

## Headers (Next.js)

Configurados em `apps/web/next.config.ts` via `lib/security/headers.ts`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restritiva
- `Strict-Transport-Security` (somente produção)
- `Content-Security-Policy` com exceção VLibras

## VLibras e CSP

Scripts e frames de `https://vlibras.gov.br` e subdomínios são permitidos em `script-src`, `style-src`, `frame-src`. Documentado como exceção necessária para acessibilidade.

## Rate limiting

- Login: `checkAuthRateLimit` — 10 tentativas / 15 min por IP (todos ambientes)
- Forgot/reset password: produção apenas
- Social: `lib/social/rate-limit.ts`
- Mensagens: limite DB-backed

## Cookies de sessão

`httpOnly`, `secure` em produção, `sameSite: lax` — `lib/auth-session.ts`

## CSRF

APIs JSON com `credentials: include` + SameSite cookies. Ações sensíveis requerem sessão válida.

## IDOR

Recursos filtrados por `userId` / participação em conversas. Testado em `test:security`.

## Express API (legado)

`helmet()` + rate limit global em `apps/api/src/index.ts`.
