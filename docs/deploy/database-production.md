# Banco de dados em produção

## Opções recomendadas

| Provedor | Uso |
|----------|-----|
| Neon | Serverless Postgres, bom com Vercel |
| Supabase | Postgres + storage opcional |
| Railway / Render | Simples para homologação |
| DigitalOcean | Managed Postgres |

## Variáveis

```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
DIRECT_URL=postgresql://...   # conexão direta para migrations (Neon)
```

## SSL

Sempre `sslmode=require` em produção.

## Migrations

```bash
npm run db:migrate:deploy
```

Nunca `db push` em produção sem revisão.

## Backup

- Provedor: snapshots automáticos
- Manual: `pg_dump` (ver `docs/ops/backup-restore.md`)
- **Nunca** commitar dumps no Git

## Pool

Prisma gerencia pool via `DATABASE_URL`. Em serverless, considerar Neon pooler ou `connection_limit`.

## Riscos

- Usar Postgres local (`.ecopet/`) em produção — **proibido**
- Mesmo banco para preview e prod — **evitar**
