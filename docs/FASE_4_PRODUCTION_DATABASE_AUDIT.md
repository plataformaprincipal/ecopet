# FASE 4.4 — Production Database Audit (somente leitura)

**Data:** 2026-08-09  
**Produção:** **nenhuma migration / push / reset / DROP**  
**Conexão Production:** **não estabelecida nesta sessão** (requer autorização + credencial)

---

## Schema / Git

| Check | Resultado |
| ----- | --------- |
| `prisma validate` | **OK** (`schema.prisma` válido) |
| Migrations no Git | **29** pastas |
| Última migration | `20260806180000_fase3_financial_ledger` |
| Drift schema↔DB Production | **NÃO MEDIDO** |
| `migrate status` Production | **NÃO EXECUTADO** |

---

## Modelos críticos (schema)

| Domínio | Modelos | Índices / uniques relevantes (schema) |
| ------- | ------- | ------------------------------------- |
| User | `User` | email/username únicos |
| Partner | `PartnerProfile` | `userId` unique; verification/approval |
| Order | `Order`, `OrderItem` | status enum; pricing snapshot Fase 2 |
| Payment | `Payment` | provider IDs; idempotency paths |
| Ledger | `LedgerAccount`, `FinancialLedgerEntry` | idempotencyKey unique (hardening) |
| Reserve | `FinancialReserve` | ligado a order/payment |
| Payout | `PartnerPayout` | status + aprovação |
| Refund | `Refund`, `PaymentRefund` | soma ≤ paid (testado homolog) |
| Reconciliation | `FinancialReconciliation`, `FinancialReconciliationRun` | status enum |
| Audit | `AuditLog` | append-oriented |
| Webhook | `WebhookEvent`, `MpWebhookEvent` | payload sanitizado; signatureValid |

---

## 4.5 Migration plan (se pendente em Production)

| MIGRATION | RISCO | LOCK | TEMPO EST. | ROLLBACK | BACKUP | VALIDAÇÃO | CLASSE |
| --------- | ----- | ---- | ---------- | -------- | ------ | --------- | ------ |
| `…fase2_commercial_pricing_snapshot` | Médio — colunas snapshot | ALTER | 1–5 min (tabelas pequenas) | restore snapshot / forward-fix | snapshot pré | counts Order | **CAUTION** |
| `…fase3_financial_ledger` | Alto — novas tabelas financeiras + uniques | CREATE/ALTER | 2–15 min | restore; sem drop automático | snapshot + PITR | ledger empty OK; uniques | **HIGH_RISK** se DB prod já com dados sem tabelas |
| Demais &lt; fase2 | Depende do estado real | — | — | — | — | migrate status | **BLOCKED** até status RO |

**Política:** nenhuma `HIGH_RISK` automática.  
**Próximo passo autorizado humano:**  
`AÇÃO = migrate status --schema …` com `DATABASE_URL` Production (somente leitura).

---

## Veredito DB

```text
PRODUCTION DATABASE AUDIT: INCOMPLETE — READ ACCESS TO PRODUCTION NOT AUTHORIZED
```

Pré-requisito para Go: status RO + backup confirmado + plano HIGH_RISK aprovado.
