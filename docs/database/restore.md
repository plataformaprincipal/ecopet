# Restore — EcoPet / Supabase

## Regra de ouro

**Nunca restaurar um backup “por cima” do projeto de produção em uso** sem clone e cutover controlado.

Preferir sempre: **Restore to a new project** (Supabase Dashboard).

## Pré-requisitos

- Acesso Owner/Admin ao projeto Supabase
- Acesso Vercel (env Production)
- Comunicação ao time (janela de manutenção)
- Anotar `DATABASE_URL` / `DIRECT_URL` atuais (sem colar em tickets públicos)

## Passo a passo — Restore to New Project

1. Dashboard Supabase → projeto atual → **Database → Backups**
2. Escolher snapshot (data/hora)
3. **Restore** → opção **New project** (nome: `ecopet-restore-YYYYMMDD`)
4. Aguardar provisionamento
5. No novo projeto, copiar connection strings:
   - Pooler `:6543` → `DATABASE_URL` (+ `pgbouncer=true`, `connection_limit=1` se serverless)
   - Direct/session `:5432` → `DIRECT_URL`
6. Em staging primeiro: apontar Preview/staging env e validar
7. Produção (cutover):
   - Manutenção / feature freeze
   - Atualizar Vercel Production `DATABASE_URL` + `DIRECT_URL`
   - Redeploy
   - `npm run db:migrate:deploy` (se o snapshot for anterior a migrations novas)
8. Validar:
   - `GET /api/health` → DB ok
   - Login admin
   - Smoke marketplace / pedido
9. Manter projeto antigo em read-only / retenção até estabilizar
10. Documentar incidente + horário do snapshot usado

## Restore local (dev apenas)

```bash
npm run db:backup:local
# ...
psql "$DIRECT_URL" -f .ecopet/backups/arquivo.sql
```

Não usar dump local para “consertar” produção.

## Pós-restore checklist

- [ ] Health OK
- [ ] Migrations alinhadas (`migrate deploy` sem erro)
- [ ] Auth (login)
- [ ] Uploads Cloudinary (independente do DB restore)
- [ ] Webhooks Mercado Pago apontando corretamente
- [ ] Secrets não vazados em logs

## PITR

Se no futuro o PITR estiver ativo, o restore pontual ainda deve preferir **projeto novo** ou procedimento oficial Supabase — atualizar este doc na ativação.
