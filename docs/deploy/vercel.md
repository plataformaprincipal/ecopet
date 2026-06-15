# Deploy Vercel — EcoPet

## Projeto

1. Conectar repositório GitHub à Vercel
2. **Root Directory:** `apps/web` (monorepo)
3. **Framework:** Next.js
4. **Build Command:** `cd ../.. && npm run build` ou `npm run build -w @ecopet/web`
5. **Install Command:** `npm ci` (na raiz)

## Variáveis obrigatórias (Production)

- `DATABASE_URL`, `DIRECT_URL`
- `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL`
- `NODE_ENV=production`

## Banco

Usar Postgres gerenciado (Neon, Supabase, Railway). Ver `docs/deploy/database-production.md`.

## Migrations

Executar antes ou no pipeline de release:

```bash
npm run db:migrate:deploy
```

## Domínios

- Production: domínio principal
- Preview: branches PR — usar `DATABASE_URL` de staging separado

## Logs

Vercel Dashboard → Functions / Runtime Logs. Observabilidade futura: Sentry (`NOT_CONFIGURED`).

## Rollback

Redeploy deployment anterior no painel Vercel. Reverter migration apenas com plano de down manual.
