# Migration Plan

| Migration | Aplicada (DB local config) | Risco | Backup | Rollback | Status |
|-----------|----------------------------|-------|--------|----------|--------|
| 27 existentes até `20260720030000_ai_production_indexes` | Sim (up to date) | Baixo (já aplicadas) | NÃO EXECUTADO em Prod | Prisma sem down automático — restore backup | APROVADO COM RESSALVA |
| Novas nesta etapa | Nenhuma | — | — | — | NÃO APLICÁVEL |

## Antes de Production

1. Confirmar backup Supabase/Postgres Production.  
2. Rodar `npx prisma migrate status` com `DATABASE_URL`/`DIRECT_URL` de **Production**.  
3. Se pendentes: analisar SQL, duração, locks.  
4. `npm run db:migrate:deploy` apenas com URL Production correta.  
5. Validar `/api/health/ready`.  

## Rollback

Restore point-in-time / backup; não editar migrations já aplicadas.
