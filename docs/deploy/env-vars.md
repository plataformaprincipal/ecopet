# Variáveis de ambiente — EcoPet

## Classificação

| Variável | Classificação | Dev | Prod |
|----------|---------------|-----|------|
| `DATABASE_URL` | DEV_REQUIRED / PROD_REQUIRED | ✅ | ✅ |
| `DIRECT_URL` | PROD_REQUIRED | opcional | ✅ (Neon/Supabase) |
| `AUTH_SECRET` | SECRET / PROD_REQUIRED | fallback dev | ✅ obrigatório |
| `NEXTAUTH_SECRET` | SECRET / PROD_REQUIRED | fallback dev | ✅ obrigatório |
| `NEXTAUTH_URL` | PROD_REQUIRED | localhost | URL produção |
| `APP_URL` | PROD_REQUIRED | localhost | URL produção |
| `JWT_SECRET` | SECRET (API) | fallback | ✅ obrigatório |
| `SMTP_*` | INTEGRATION_OPTIONAL | MailDev/Gmail | provedor real |
| `CLOUDINARY_*` | INTEGRATION_OPTIONAL | — | upload produção |
| `UPLOAD_DEV_FALLBACK` | DEV_ONLY | `1` permitido | **bloqueado** |
| `OPENAI_API_KEY` | INTEGRATION_OPTIONAL | — | IA real |
| `MERCADOPAGO_*` | INTEGRATION_OPTIONAL | — | pagamentos |
| `SENTRY_DSN` | INTEGRATION_OPTIONAL | — | observabilidade |

## Comportamento

- **Produção:** `apps/web/src/lib/env.ts` falha se `AUTH_SECRET` / `NEXTAUTH_SECRET` ausentes
- **Integrações:** retornam `NOT_CONFIGURED` via Central de Integrações — não erro 500
- **Upload local:** bloqueado em `NODE_ENV=production` sem Cloudinary/Supabase
- **Secrets:** nunca logados; `redactSecrets()` em logs estruturados

## Sync

```bash
npm run sync:env   # copia DATABASE_URL para apps/web e packages/database
```

## Referência

Ver `.env.example` na raiz do monorepo.
