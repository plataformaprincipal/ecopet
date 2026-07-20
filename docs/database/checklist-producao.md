# Checklist de Produção — Banco / Supabase

## Integridade

- [x] Prisma `provider=postgresql` + `DATABASE_URL` / `DIRECT_URL`
- [x] Migrations: 25 aplicadas (`migrate deploy` sem pendências — verificado na auditoria)
- [x] Health `SELECT 1` via `/api/health` e painel Produção
- [ ] Retenção de backup diário anotada no Dashboard
- [x] PITR **não** habilitado (esperado nesta fase)
- [x] DR documentado (`disaster-recovery.md`)
- [x] Restore documentado (`restore.md`)
- [x] Storage Cloudinary auditado; Supabase Storage stub documentado
- [x] Auth custom auditado (não Supabase Auth)
- [x] Sem `SERVICE_ROLE` no client
- [x] `apps/web` `db:setup` usa migrate:deploy (não push)

## Operação

- [ ] Drill restore anual agendado
- [ ] Preview/staging **não** apontam para o mesmo DB de produção (recomendado)
- [ ] Secrets só na Vercel Production
- [ ] Pós-deploy: health + smoke login

## Comandos de validação

```bash
npm run db:generate
npm run db:migrate:deploy
npm run type-check -w @ecopet/web
npm run lint -w @ecopet/web
npm run test:production -w @ecopet/web
npm run build -w @ecopet/web
```

## Painel

`/admin/producao` → seção **Banco**: host sanitizado, PITR=off, backups MANUAL, auth/storage.

## Go / No-go

| Critério | Go se |
|----------|-------|
| Banco | Health ONLINE |
| Migrations | Zero pendentes |
| Backup | Daily confirmado no Dashboard |
| PITR | Decisão consciente (off ok em fase atual) |
| Secrets | Nenhum no Git / logs |
| Docs | DR + restore lidos pelo on-call |
