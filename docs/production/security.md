# Segurança

## Controles presentes

- Cookies de sessão: `httpOnly`, `SameSite=Lax`, `Secure` em produção
- Guards: `requireAuth`, `requireAdmin`, ownership em pets/orders/chat
- CSP + headers em `lib/security/headers.ts` / `next.config.ts`
- Turnstile em cadastro/contato/recuperação (+ login risk-based)
- Redaction Better Stack; token só servidor
- Prisma: sem `$queryRawUnsafe` encontrado

## Hardening recente

Ver `final-audit.md`.

## Pendências P0/P1

1. Configurar `MERCADO_PAGO_WEBHOOK_SECRET` antes de processar pagamentos
2. Turnstile site+secret em produção (fail-open se ausente)
3. HMAC real para Stripe/Pagarme se forem ativados (hoje verificação fraca)
4. CSP ainda permite `unsafe-inline` / `unsafe-eval` (VLibras/TalkJS/Maps)
5. CSRF token dedicado ausente (mitigado por SameSite=Lax)

## npm audit

Executar `npm audit --omit=dev` a cada release; corrigir críticas/altas quando seguro. Não bump major indiscriminado.
