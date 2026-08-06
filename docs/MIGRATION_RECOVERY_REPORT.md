# Relatório de Recuperação de Migrations — Fase 1

**Data:** 2026-08-06  
**Branch:** `fix/fase-1-estabilizacao-critica`  
**Ponto de restauração:** `release/etapa-5-auditoria-final` @ `95e8d1c`

## Diagnóstico

| Métrica | Antes | Depois |
| ------- | ----: | -----: |
| Diretórios de migration locais | 27 | 27 |
| Arquivos `migration.sql` no Git HEAD | 7 | **27** (7 já rastreados + 20 recuperados) |
| Causa do ignore | `.gitignore` → `*.sql` | Exceção `!packages/database/prisma/migrations/**/*.sql` |

### Migrations já rastreadas (antes)

1. `20250614180000_init_ecopet_schema`
2. `20250614210000_etapa5_pets_appointments`
3. `20250614210001_etapa5_pets_appointments_schema`
4. `20250615090000_etapa7_8_order_status`
5. `20250615090001_etapa7_8_marketplace`
6. `20250615100000_order_partner_relation`
7. `20250615200000_etapa9a_integrations`

### Migrations recuperadas (adicionadas ao Git nesta fase)

1. `20250617120000_product_service_extended_fields`
2. `20260617_partner_register_extended`
3. `20260621_partner_docs_cnpj`
4. `20260623120000_marketplace_flow_indexes_rejected`
5. `20260623120000_social_post_persona_types`
6. `20260623180000_notification_center`
7. `20260706120000_admin_approval_fields`
8. `20260707030000_ai_platform`
9. `20260708150000_integration_automation_global`
10. `20260711180000_ai_openai_platform`
11. `20260718190000_mercado_pago_orders_payment`
12. `20260718210000_mp_webhook_multi_topic`
13. `20260719010000_turnstile_security_verification`
14. `20260719020000_payment_refunds_finance`
15. `20260719030000_fcm_push_devices`
16. `20260719180000_google_maps_location`
17. `20260719210000_analytics_ops_state`
18. `20260720010000_analytics_transactional_dedup`
19. `20260720020000_ai_enterprise_observability`
20. `20260720030000_ai_production_indexes`

## Conteúdo das migrations

- Nenhum SQL histórico foi alterado.
- Nenhum `prisma migrate reset` / recriação de banco foi executado.
- Nenhuma migration consolidada foi gerada.

## Estado do banco auditado (workspace)

- `npx prisma validate` — schema válido.
- `npx prisma migrate status` — **27 migrations found; Database schema is up to date**.
- As 20 migrations recuperadas **já estavam aplicadas** no datasource configurado localmente; risco de reaplicação neste DB: **nenhum** (`No pending migrations`).

## Divergências / riscos

| Risco | Severidade | Mitigação |
| ----- | ---------- | --------- |
| Clone fresco anterior a este commit só tinha 7 SQLs | Alto (corrigido) | Versionar as 20 faltantes |
| Novo ambiente vazio precisa `migrate deploy` com as 27 | Médio | Pipeline CI/ops deve rodar `npm run db:migrate:deploy` com `DIRECT_URL` |
| Ambiente intermediário com schema via `db push` sem `_prisma_migrations` | Alto | Não usar `db push` em staging/prod; alinhar histórico antes do deploy |
| Outros `*.sql` (backups) continuam ignorados | Baixo | Intencional — só migrations Prisma liberadas |

## Passos manuais para produção / staging

1. Merge deste branch e confirmar que os 27 `migration.sql` estão no remote.
2. Em staging novo: configurar `DATABASE_URL` + `DIRECT_URL` e rodar `npm run db:migrate:deploy`.
3. Em produção já sincronizada (como o workspace atual): `migrate status` deve continuar “up to date”; **não** reaplicar manualmente.
4. Se algum ambiente divergir: comparar `_prisma_migrations` com a pasta versionada; resolver com DBA — **não** resetar produção.
5. Remover qualquer cópia local de SQL de backup do working tree antes de commits.

## Alteração no `.gitignore`

```gitignore
*.sql
# Prisma migrations must be versioned (exception to *.sql)
!packages/database/prisma/migrations/**/*.sql
```
