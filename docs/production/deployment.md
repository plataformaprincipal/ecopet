# Deploy (Vercel)

1. Backup DB
2. `db:migrate:deploy` (ou job CI)
3. Set env Production (ver environment-variables.md)
4. Deploy
5. Smoke (smoke-tests.md)
6. Monitorar Better Stack + health
7. Rollback se P0

Build: `npm run build` (script root com heap 8GB).

Não misturar credenciais test/prod no mesmo Environment.
