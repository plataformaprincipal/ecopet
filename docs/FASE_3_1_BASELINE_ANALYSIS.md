# Fase 3.1 — Análise de Baseline (eccopet-homolog)

**Data:** 2026-08-07  
**Branch Git:** `test/fase-3-1-financial-preview`  
**Banco:** Supabase branch `eccopet-homolog` (Preview)  
**Env:** `apps/web/.env.preview.verify` (gitignored)  
**Production:** intocada  

---

## 1. Ambiente (somente leitura)

| Check | Resultado |
| ----- | --------- |
| Preview DB ≠ Production DB | **OK** (`393dd486e416...` ≠ `b8275cf8f562...`) |
| DIRECT_URL ≠ Production | **OK** (`785a567fdfb9...` ≠ `37dac30b4d39...`) |
| Host DIRECT | `aws-0-sa-east-1.pooler.supabase.com:5432` |
| SELECT 1 | **OK** |

---

## 2. Causa do P3018

`migrate deploy` tentou aplicar `20250614180000_init_ecopet_schema` em banco que **já possui** enums/tabelas herdados (`UserRole already exists`, PostgreSQL `42710`).

Registro residual em `_prisma_migrations`:

| migration_name | finished_at | rolled_back_at | applied_steps_count |
| -------------- | ----------- | -------------- | ------------------- |
| `20250614180000_init_ecopet_schema` | `null` (falha) | `null` | `0` |

---

## 3. Inventário e classificação

Método:

1. Parse estrutural de cada `migration.sql` (enums/tabelas/colunas/índices/constraints).  
2. Comparação com `information_schema` / `pg_catalog` na branch homolog.  
3. Probe profunda para `ALTER TYPE ... ADD VALUE` e coluna temporária `typeEnum` → `type`.

### Reclassificação evidenciada

| Migration | Classe inicial | Classe final | Motivo |
| --------- | -------------- | ------------ | ------ |
| `...etapa5_pets_appointments` | D | **A** | Só `ALTER TYPE AppointmentStatus ADD VALUE`; valores PENDING/CONFIRMED/NO_SHOW presentes |
| `...etapa7_8_order_status` | D | **A** | Só `ALTER TYPE OrderStatus ADD VALUE`; valores esperados presentes |
| `...notification_center` | B | **A** | “Falta” era `Notification.typeEnum` (coluna **temporária** renomeada para `type`); estado final completo (`NotificationType`, colunas, `NotificationPreference`) |

### Contagem final

| Classe | Qtd | Significado |
| ------ | --: | ----------- |
| A — COMPLETAMENTE PRESENTE | **29/29** | Schema já reflete a migration |
| B — PARCIAL | **0** | — |
| C — AUSENTE | **0** | — |
| D — INCONCLUSIVA | **0** | — |

---

## 4. Tabela Migration × Histórico × Schema

| Migration no Git | Registro em `_prisma_migrations` | Evidência no schema | Situação |
| ---------------- | -------------------------------- | ------------------- | -------- |
| `20250614180000_init_ecopet_schema` | falha (`finished_at` null, steps 0) | enums/tabelas init presentes | A — resolver `--applied` |
| `20250614210000_etapa5_pets_appointments` | ausente | enum values OK | A |
| `20250614210001_etapa5_pets_appointments_schema` | ausente | tabelas/cols OK | A |
| `20250615090000_etapa7_8_order_status` | ausente | enum values OK | A |
| `20250615090001_etapa7_8_marketplace` | ausente | OK | A |
| `20250615100000_order_partner_relation` | ausente | OK | A |
| `20250615200000_etapa9a_integrations` | ausente | OK | A |
| `20250617120000_product_service_extended_fields` | ausente | OK | A |
| `20260617_partner_register_extended` | ausente | OK | A |
| `20260621_partner_docs_cnpj` | ausente | OK | A |
| `20260623120000_marketplace_flow_indexes_rejected` | ausente | OK | A |
| `20260623120000_social_post_persona_types` | ausente | OK | A |
| `20260623180000_notification_center` | ausente | estado final OK | A |
| `20260706120000_admin_approval_fields` | ausente | OK | A |
| `20260707030000_ai_platform` | ausente | OK | A |
| `20260708150000_integration_automation_global` | ausente | OK | A |
| `20260711180000_ai_openai_platform` | ausente | OK | A |
| `20260718190000_mercado_pago_orders_payment` | ausente | OK | A |
| `20260718210000_mp_webhook_multi_topic` | ausente | OK | A |
| `20260719010000_turnstile_security_verification` | ausente | OK | A |
| `20260719020000_payment_refunds_finance` | ausente | OK | A |
| `20260719030000_fcm_push_devices` | ausente | OK | A |
| `20260719180000_google_maps_location` | ausente | OK | A |
| `20260719210000_analytics_ops_state` | ausente | OK | A |
| `20260720010000_analytics_transactional_dedup` | ausente | OK | A |
| `20260720020000_ai_enterprise_observability` | ausente | OK | A |
| `20260720030000_ai_production_indexes` | ausente | OK | A |
| `20260806120000_fase2_commercial_pricing_snapshot` | ausente | cols/índice OK (ver §5) | A |
| `20260806180000_fase3_financial_ledger` | ausente | tabelas financeiras OK (ver §5) | A |

---

## 5. Fase 2 e Fase 3 (evidência objetiva)

### Fase 2 — `20260806120000_fase2_commercial_pricing_snapshot`

Presentes na branch:

- `Order.grossAmount`, `platformFeeAmount`, `partnerAmount`, `pricingVersion`, `currency`, `idempotencyKey`
- `Order_idempotencyKey_key`
- `OrderItem.grossAmount`, `platformFeeAmount`, `partnerAmount`, `pricingVersion`
- `PlatformSettings.pricingVersion`, `platformFeePercent`, `platformFixedFee`

**Conclusão:** COMPLETAMENTE PRESENTE → elegível a `resolve --applied` (não reexecutar SQL).

### Fase 3 — `20260806180000_fase3_financial_ledger`

Tabelas presentes:

- `LedgerAccount`, `FinancialLedgerEntry`, `PartnerPayout`
- `FinancialReserve`, `FinancialChargeback`
- `FinancialReconciliation`, `FinancialReconciliationRun`, `FinancialManualAdjustment`

**Conclusão:** COMPLETAMENTE PRESENTE → elegível a `resolve --applied`.

> A branch homolog **herdou** schema que já inclui objetos Fase 2/3. Não assumir presença só por origem Production; presença foi medida por queries.

---

## 6. `prisma migrate diff` (DB → schema.prisma)

Comando (sanitizado):

```text
prisma migrate diff
  --from-url <DIRECT_URL homolog>
  --to-schema-datamodel packages/database/prisma/schema.prisma
  --script
```

Resultado significativo (1 linha):

```sql
ALTER TABLE "AnalyticsTransactionalDedup" ALTER COLUMN "lastAttemptAt" DROP DEFAULT;
```

Drift residual **mínimo** e **fora** das migrations Fase 2/3. Não bloqueia baseline do histórico. Não aplicado automaticamente.

---

## 7. Plano de baseline (autorizado pela evidência)

1. Para cada uma das 29 migrations (ordem cronológica): `prisma migrate resolve --applied <name>`  
2. Confirmar `_prisma_migrations.finished_at` após cada uma  
3. `migrate status` → up to date  
4. Segundo `migrate deploy` → no pending  
5. Sem `reset`, sem `db push`, sem editar SQL histórico  

Nenhuma migration classificada B/C após correção de falso positivo.
