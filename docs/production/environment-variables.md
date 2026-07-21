# Variáveis de ambiente (produção)

Nunca usar `NEXT_PUBLIC_` para secrets.

## Críticas

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Prisma pooler |
| `DIRECT_URL` | Migrations |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Sessão JWT (≥32 chars) |
| `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` | URLs públicas https |

## Integrações (servidor)

| Integração | Variáveis |
|---|---|
| Mercado Pago | `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `MERCADO_PAGO_ENVIRONMENT=production`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` |
| TalkJS Live | `NEXT_PUBLIC_TALKJS_APP_ID`, `TALKJS_SECRET_KEY`, `TALKJS_ENVIRONMENT=live`, `TALKJS_WEBHOOK_SECRET` |
| OpenAI | `OPENAI_API_KEY`, `AI_ENABLED=true` |
| Better Stack | `BETTER_STACK_SOURCE_TOKEN`, `BETTER_STACK_HOST`, `BETTER_STACK_ENVIRONMENT=production` |
| Firebase | `FIREBASE_*` admin + `NEXT_PUBLIC_FIREBASE_*` + VAPID |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Resend | `RESEND_API_KEY`, `EMAIL_FROM` |
| Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_ENABLED=true` |
| Maps | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (restringir por domínio) |
| GA/GTM | `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID` + consent |

## Proibidas em produção

`FORCE_INSECURE_SESSION_COOKIE`, `AUTH_RATE_LIMIT_DISABLED`, `AUTH_TEST_EXPOSE_OTP`, `ALLOW_TEST_RESEND`, `TURNSTILE_DEV_BYPASS`, `AUTH_TEST_RESET_RATE_LIMIT`

Validação: `npm run validate:env`
