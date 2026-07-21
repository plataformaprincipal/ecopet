# Auditoria final (evidências)

Data de referência: ciclo técnico pré-homologação.

## Comandos de evidência

```bash
npm run lint
npm run type-check   # heap 8GB recomendado no web
npm run test         # foundation runner
npm run test:security
npm run test:observability -w @ecopet/web
npm run db:generate
npm run build
npm audit --omit=dev
```

## Hardening aplicado neste ciclo

| Correção | Evidência |
|---|---|
| MP webhook fail-closed sem secret em produção | `lib/mercado-pago/webhooks/pipeline.ts` |
| `FORCE_INSECURE_SESSION_COOKIE` ignorado em produção | `lib/auth-session.ts` |
| `AUTH_RATE_LIMIT_DISABLED` / RELAXED bloqueados em produção | `lib/rate-limit.ts` |
| `/api/health` sem leak de host/env | `app/api/health/route.ts` |
| OTP de teste nunca em produção | `lib/auth/recovery-otp-dev.ts` |
| Rotas test-resend / test-email-template bloqueadas em produção | `app/api/test-*` |
| Webhooks genéricos exigem header de assinatura em produção | `lib/webhooks/webhook-handler.ts` |
| Senha bootstrap removida do plaintext (hash SHA-256) | `apps/api/.../auth-service.ts` |
| Login sem enumeração de conta (mensagem/código unificados) | `auth-messages.ts`, `login/route.ts` |

## Parecer

**APROVADO PARA HOMOLOGAÇÃO**

Não **APROVADO PARA PRODUÇÃO** sem: TalkJS Live, Mercado Pago produção + webhook secret, Better Stack evento real + alertas, Turnstile prod, smoke em Preview, backup/restore comprovados.
