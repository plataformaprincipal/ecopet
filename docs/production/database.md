# Banco / Prisma / Supabase

- Schema: `packages/database/prisma/schema.prisma`
- Client: `packages/database/src/client.ts` (pooler + `connection_limit=1` na Vercel)
- `DATABASE_URL` = pooler; `DIRECT_URL` = migrations
- Health: `/api/health/ready` executa `SELECT 1`
- Não expor service role Supabase no frontend
- RLS: app usa Prisma com service connection — autorização na camada de aplicação (guards)

Comando: `npm run db:generate`
