# Variáveis de ambiente — EcoPet

> **Fonte única no código:** `apps/web/src/lib/env-registry.ts`  
> **Validação produção:** `apps/web/src/lib/validate-production-env.ts`  
> **Template:** `.env.example` (raiz do monorepo)

## Deploy Vercel — checklist mínimo

Copie para **Vercel → Settings → Environment Variables → Production**:

| Variável | Obrigatória | Exemplo |
|----------|-------------|---------|
| `DATABASE_URL` | ✅ | `postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | ✅ (CI/migrations) | `postgresql://...@...pooler.supabase.com:5432/postgres` |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | ✅* | igual a `AUTH_SECRET` ou omitir |
| `NEXTAUTH_URL` | ✅ | `https://ecopet-web.vercel.app` |
| `APP_URL` | ✅ | `https://ecopet-web.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://ecopet-web.vercel.app` |
| `RESEND_API_KEY` | recomendado | `re_xxxxx` |
| `EMAIL_FROM` | recomendado | `no-reply@seudominio.com` |
| `CLOUDINARY_*` (3 vars) | recomendado | painel Cloudinary |

\* Basta `AUTH_SECRET` **ou** `NEXTAUTH_SECRET` (ou ambos com o mesmo valor).

## Validar localmente antes do deploy

```bash
node scripts/validate-production-env.mjs
```

## Comportamento em produção

- `instrumentation.ts` + `env.ts` validam variáveis críticas no boot
- `GET /api/health` retorna 503 com `missingCritical` / `missingRecommended` se o banco falhar
- Integrações opcionais retornam `NOT_CONFIGURED` — não erro 500 genérico

## Sync local

```bash
npm run sync:env   # copia DATABASE_URL para apps/web e packages/database
```

## Referência completa

Ver `.env.example` na raiz — todas as variáveis documentadas com seções por funcionalidade.
