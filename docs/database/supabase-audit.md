# Auditoria Supabase — EcoPet

**Data da auditoria (código):** 2026-07-20  
**Plano informado pelo time:** Supabase **Pro** · backups diários **ativos** · **PITR não habilitado**

## Escopo comprovado no repositório

| Item | Evidência | Status |
|------|-----------|--------|
| Postgres via Prisma | `packages/database/prisma/schema.prisma` `provider=postgresql` | OK |
| Pooler runtime | `DATABASE_URL` porta `:6543` + `pgbouncer=true` | OK (padrão documentado) |
| Migrations diretas | `DIRECT_URL` + `directUrl` no schema | OK |
| Models | ~213 models / ~78 enums | OK |
| Migrations | 25 pastas; `migrate deploy` sem pendências (verificado) | OK |
| Auth | Custom JWT + `User.passwordHash` — **não** Supabase Auth | OK |
| Storage uploads | Cloudinary; Supabase Storage **stub** | OK (documentado) |
| RLS nas migrations | Nenhuma `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` | OK (app-layer) |
| Extensões Prisma | Nenhuma `postgresqlExtensions` no schema | N/A no código |
| Health | `GET /api/health` + painel Produção | OK |

## O que NÃO pode ser comprovado só pelo Git

- Retenção exata dos backups diários no Dashboard
- CPU/RAM/conexões em tempo real
- RLS criado manualmente no Dashboard
- Buckets Supabase Storage no projeto
- Histórico de restores
- Extensões instaladas só no cluster (uuid-ossp, etc.)

## Papel do Supabase no EcoPet

**Supabase = PostgreSQL gerenciado** para a aplicação Next.js (Vercel) via Prisma.

Não é (hoje):

- Provedor de sessão/login (Supabase Auth)
- CDN de uploads (Cloudinary)
- Cliente `@supabase/supabase-js` no app

## Pooling

| Uso | URL | Porta típica |
|-----|-----|--------------|
| Runtime (Vercel/serverless) | `DATABASE_URL` | `6543` transaction pooler |
| Migrations | `DIRECT_URL` | `5432` session / direct |

Em Vercel, `packages/database/src/client.ts` pode acrescentar `connection_limit=1` e `sslmode=require`.

## Migrations — higiene

- Timestamp duplicado (pastas distintas): `20260623120000_marketplace_flow_indexes_rejected` e `20260623120000_social_post_persona_types` — **não apagar**; Prisma usa o nome completo da pasta.
- Política: **apenas** `npm run db:migrate:deploy` em produção. **Nunca** `db push` / `migrate reset` em produção.

## Correção aplicada nesta auditoria

- `apps/web` `db:setup` alinhado a **generate + migrate:deploy** (antes usava `db:push`).
- Painel `/admin/producao` → seção **Banco** com resumo sanitizado + checks.

## Referências

- [backups.md](./backups.md) · [disaster-recovery.md](./disaster-recovery.md) · [restore.md](./restore.md)
- [storage.md](./storage.md) · [auth.md](./auth.md) · [security.md](./security.md)
- [checklist-producao.md](./checklist-producao.md)
- Painel: `/admin/producao` (área Banco)
