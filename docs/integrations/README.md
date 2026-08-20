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
| Google Auth | [GOOGLE_AUTH.md](./GOOGLE_AUTH.md) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | login senha |
| OpenAI | [openai.md](./openai.md) | `AI_ENABLED`, `OPENAI_API_KEY` | UI/API `AI_NOT_CONFIGURED` |
| Resend | [EMAIL_RESEND.md](./EMAIL_RESEND.md) / [resend.md](./resend.md) | `RESEND_API_KEY`, `EMAIL_FROM` | e-mail não enviado |
| Twilio | [twilio.md](./twilio.md) | `TWILIO_*`, `SMS_PROVIDER` | SMS indisponível |
| TalkJS | [MESSAGING.md](./MESSAGING.md) / [talkjs.md](./talkjs.md) | `NEXT_PUBLIC_TALKJS_APP_ID`, `TALKJS_SECRET_KEY` | mensagem clara na UI |
| Cloudinary | [cloudinary.md](./cloudinary.md) | `CLOUDINARY_*` | fallback local só em dev |
| Mercado Pago | [mercado-pago.md](./mercado-pago.md) | `MERCADO_PAGO_*` | `PAYMENT_PROVIDER=none` |
| Stripe | [stripe.md](./stripe.md) | `STRIPE_*` | idem |
| Push | [push.md](./push.md) | `VAPID_*` | canal skipped |
| Supabase | (DB) | `DATABASE_URL`, `DIRECT_URL` | obrigatório |
| Google Analytics 4 | [../google-analytics-4.md](../google-analytics-4.md) | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | tracking off / DEV_ONLY |
| Google Tag Manager | [google-tag-manager-production.md](./google-tag-manager-production.md) | `NEXT_PUBLIC_GTM_ID` | container não carrega |

Inventário: [INVENTORY.md](./INVENTORY.md). Health: [HEALTH.md](./HEALTH.md). Incidentes: [RUNBOOK.md](./RUNBOOK.md).

## Status no código

- Registry: `apps/web/src/lib/integrations/integration-registry.ts`
- Launch gate: `apps/web/src/lib/integrations/launch-health.ts`
- Status: `apps/web/src/lib/integrations/integration-status.ts`
- API: `GET /api/admin/integrations/status`
- Smoke: `POST /api/admin/integrations/{provider}/test`
- Produção GTM: `/admin/producao/google-tag-manager`

## Produção

Ver [../production-readiness.md](../production-readiness.md) e [google-tag-manager-production.md](./google-tag-manager-production.md).
