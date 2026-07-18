# Integrações EcoPet — índice

Este diretório documenta como ativar provedores externos **somente com variáveis de ambiente**, sem hardcode de secrets.

## Princípios

1. Sem credencial → estado `NOT_CONFIGURED` / `SKIPPED_NOT_CONFIGURED` — **nunca sucesso falso**.
2. Secrets só no servidor (Vercel / `.env` local não versionado).
3. Painel admin: `/admin/integracoes` (status + smoke test).
4. Checklist genérico: preencher variável → reiniciar → smoke no admin → logs → feature flag → monitorar.

## Provedores

| Provedor | Doc | Variáveis principais | Sem chave |
|----------|-----|----------------------|-----------|
| OpenAI | [openai.md](./openai.md) | `AI_ENABLED`, `OPENAI_API_KEY` | UI/API `AI_NOT_CONFIGURED` |
| Resend | [resend.md](./resend.md) | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_DOMAIN_VERIFIED` | e-mail não enviado; status `DOMAIN_PENDING` até DNS |
| Twilio | [twilio.md](./twilio.md) | `TWILIO_*`, `SMS_PROVIDER` | SMS indisponível |
| TalkJS | [talkjs.md](./talkjs.md) | `NEXT_PUBLIC_TALKJS_APP_ID`, `TALKJS_SECRET_KEY` | mensagem clara na UI |
| Cloudinary | [cloudinary.md](./cloudinary.md) | `CLOUDINARY_*` | fallback local só em dev |
| Mercado Pago | [mercado-pago.md](./mercado-pago.md) | `MERCADO_PAGO_*` | `PAYMENT_PROVIDER=none` |
| Stripe | [stripe.md](./stripe.md) | `STRIPE_*` | idem |
| Push | [push.md](./push.md) | `VAPID_*` | canal skipped |
| Supabase | (DB) | `DATABASE_URL`, `DIRECT_URL` | obrigatório |

## Status no código

- Registry: `apps/web/src/lib/integrations/integration-registry.ts`
- Status: `apps/web/src/lib/integrations/integration-status.ts`
- API: `GET /api/admin/integrations/status`
- Smoke: `POST /api/admin/integrations/{provider}/test`

## Produção

Ver [../production-readiness.md](../production-readiness.md).
