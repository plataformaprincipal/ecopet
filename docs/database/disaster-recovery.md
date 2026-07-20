# Disaster Recovery — EcoPet

## Objetivos

| Métrica | Alvo atual (dev avançado / pré-scale) | Alvo pós go-live crítico |
|---------|----------------------------------------|---------------------------|
| **RPO** | ≤ 24h (backup diário) | Avaliar PITR (minutos) |
| **RTO** | ≤ 4–8h (restore + DNS/env + migrate) | ≤ 2–4h com runbook ensaiado |

RPO/RTO dependem do plano Supabase e da disponibilidade do time — ajustar após drill.

## Responsáveis

| Papel | Responsabilidade |
|-------|------------------|
| Tech Lead / SRE | Decisão de restore, comunicação |
| DBA / Backend | Execução migrate, validação Prisma |
| DevOps | Vercel env, DNS, secrets |
| Produto | Aceite funcional pós-restore |

## Cenários

1. **Corrompimento lógico** (delete em massa, migrate ruim) → Restore to New Project a partir do backup; cutover de `DATABASE_URL`/`DIRECT_URL`
2. **Indisponibilidade região** → Contato Supabase; avaliar projeto novo + restore
3. **Credenciais vazadas** → Rotacionar senha DB + secrets Vercel; invalidar sessões se necessário
4. **Falha só da app** → Redeploy Vercel; banco intacto

## Procedimento resumido

1. Declarar incidente; congelar deploys destrutivos
2. Avaliar: app-only vs data loss
3. Se data: seguir [restore.md](./restore.md) (**New Project**, nunca overwrite cego)
4. Apontar Vercel Production para o novo `DATABASE_URL` / `DIRECT_URL`
5. `npm run db:migrate:deploy` se o restore for de snapshot anterior a migrations recentes
6. Validar `/api/health`, login admin, pedido/pagamento smoke
7. Post-mortem em 48h

## Testes

| Frequência | Ação |
|------------|------|
| Antes de release com migrate sensível | Backup confirmado + plano de rollback |
| Mensal (recomendado) | Revisar Dashboard backups + este runbook |
| Anual | Drill completo Restore to New Project + cutover em staging |

## O que NÃO fazer

- Restaurar backup **direto sobre** o projeto de produção sem clone
- `prisma migrate reset` em produção
- Confiar no `BackupJob` do painel Gestor (stub)
- Habilitar PITR “no susto” sem orçamento/runbook

## Documentos ligados

- [backups.md](./backups.md) · [restore.md](./restore.md) · [checklist-producao.md](./checklist-producao.md)
- `docs/deploy/rollback-checklist.md`
