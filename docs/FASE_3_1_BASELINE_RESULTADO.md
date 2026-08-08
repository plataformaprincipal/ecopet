# Fase 3.1 — Baseline controlado — Resultado

**Data:** 2026-08-07  
**Branch Git:** `test/fase-3-1-financial-preview`  
**Banco:** Supabase branch `eccopet-homolog` (Preview)  
**Env:** `apps/web/.env.preview.verify`  
**Production:** **intocada**  
**Deploy Vercel:** **não executado** nesta etapa  

Análise detalhada: `docs/FASE_3_1_BASELINE_ANALYSIS.md`

---

## 1. Estado inicial

| Item | Valor |
| ---- | ----- |
| Isolamento Preview ≠ Production | OK |
| SELECT 1 / autenticação | OK |
| `db:generate` | exit 0 |
| `db:migrate:deploy` | exit 1 / **P3018** |
| Migration falha | `20250614180000_init_ecopet_schema` |
| Erro | `42710 type "UserRole" already exists` |
| `_prisma_migrations` | 1 registro falho (`finished_at` null, steps 0) |

---

## 2. Causa do P3018

A branch homolog **herdou schema completo** (enums/tabelas já existentes), mas o histórico Prisma estava vazio/desalinhado. O deploy tentou reaplicar a migration inicial.

---

## 3. Histórico `_prisma_migrations` (antes → depois)

**Antes:** 1 linha falha da init.  

**Depois:**

- 29 migrations com `finished_at` preenchido e `rolled_back_at` null  
- 1 linha residual da tentativa falha da init marcada com `rolled_back_at` (substituída pelo resolve `--applied`)

---

## 4. Migrations já refletidas no schema

**Todas as 29** do repositório (classe A após auditoria + probes).

Inclui falso positivo corrigido:

- `notification_center`: “falta” de `typeEnum` era coluna temporária renomeada para `type`  
- `etapa5` / `etapa7_8_order_status`: só `ALTER TYPE ADD VALUE` — valores confirmados no enum

---

## 5. Migrations ausentes

**Nenhuma** (classe C = 0).

Portanto **não** houve SQL novo via `migrate deploy` após o baseline — apenas alinhamento de histórico.

---

## 6. Migrations parcialmente refletidas

**Nenhuma** após correção de classificação (classe B = 0).

---

## 7. `migrate resolve --applied` executados

Ordem cronológica, um a um, com verificação de registro `finished` após cada:

1. `20250614180000_init_ecopet_schema`  
2. `20250614210000_etapa5_pets_appointments`  
3. `20250614210001_etapa5_pets_appointments_schema`  
4. `20250615090000_etapa7_8_order_status`  
5. `20250615090001_etapa7_8_marketplace`  
6. `20250615100000_order_partner_relation`  
7. `20250615200000_etapa9a_integrations`  
8. `20250617120000_product_service_extended_fields`  
9. `20260617_partner_register_extended`  
10. `20260621_partner_docs_cnpj`  
11. `20260623120000_marketplace_flow_indexes_rejected`  
12. `20260623120000_social_post_persona_types`  
13. `20260623180000_notification_center`  
14. `20260706120000_admin_approval_fields`  
15. `20260707030000_ai_platform`  
16. `20260708150000_integration_automation_global`  
17. `20260711180000_ai_openai_platform`  
18. `20260718190000_mercado_pago_orders_payment`  
19. `20260718210000_mp_webhook_multi_topic`  
20. `20260719010000_turnstile_security_verification`  
21. `20260719020000_payment_refunds_finance`  
22. `20260719030000_fcm_push_devices`  
23. `20260719180000_google_maps_location`  
24. `20260719210000_analytics_ops_state`  
25. `20260720010000_analytics_transactional_dedup`  
26. `20260720020000_ai_enterprise_observability`  
27. `20260720030000_ai_production_indexes`  
28. `20260806120000_fase2_commercial_pricing_snapshot`  
29. `20260806180000_fase3_financial_ledger`  

Nenhum SQL das migrations foi reexecutado pelo resolve.

---

## 8. Migrations efetivamente executadas (SQL)

**Nenhuma** via `migrate deploy` nesta rodada — schema já continha os objetos (incluindo Fase 2/3).

---

## 9. Resultado do `migrate status`

```text
29 migrations found in prisma/migrations
Database schema is up to date!
EXIT=0
```

`prisma validate`: schema válido, EXIT=0.

---

## 10. Segundo `migrate deploy` (idempotência)

```text
No pending migrations to apply.
EXIT=0
```

Não tentou recriar `UserRole`. Sem alterações de schema.

(Uma tentativa intermediária falhou com `P1001`/DNS transitório; reexecução OK.)

---

## 11. Drift restante

`prisma migrate diff` (DB → `schema.prisma`):

```sql
ALTER TABLE "AnalyticsTransactionalDedup" ALTER COLUMN "lastAttemptAt" DROP DEFAULT;
```

Drift cosmético/mínimo, **fora** do escopo Fase 2/3. **Não** aplicado automaticamente.

---

## 12. Riscos

| Risco | Mitigação / nota |
| ----- | ---------------- |
| Branch herdou schema + dados | Baseline só alinha histórico; não valida dados de negócio |
| Resolve sem reexecutar SQL | Seguro apenas porque auditoria mostrou presença integral |
| Drift `lastAttemptAt` DEFAULT | Documentado; não bloqueia deploy Preview financeiro |
| Production | Nunca usada nesta operação |

---

## 13. Arquivos alterados / gerados

| Path | Nota |
| ---- | ---- |
| `docs/FASE_3_1_BASELINE_ANALYSIS.md` | Auditoria pré-resolve |
| `docs/FASE_3_1_BASELINE_RESULTADO.md` | Este relatório |
| Banco homolog `_prisma_migrations` | Histórico alinhado (29 applied) |
| Production / migrations SQL históricas | **não** alterados |

Scripts temporários de auditoria/resolução foram usados localmente e devem ser removidos (não versionar secrets).

---

## 14. Validação somente leitura pós-baseline

| Check | Resultado |
| ----- | --------- |
| SELECT 1 | OK |
| Applied finished count | 29 |
| Fase 2 + Fase 3 registradas | OK |
| Colunas Order Fase 2 | grossAmount, platformFeeAmount, partnerAmount, pricingVersion, currency, idempotencyKey |
| Tabelas Fase 3 | LedgerAccount, FinancialLedgerEntry, PartnerPayout, FinancialReserve, FinancialChargeback, FinancialReconciliation, FinancialReconciliationRun, FinancialManualAdjustment |

---

## 15. Veredito

```text
BASELINE CONCLUÍDO — BANCO HOMOLOG PRONTO PARA DEPLOY
```

Pronto para retomar Fase 3.1 no **deploy Preview** `ecopet-web` (ainda não executado).
