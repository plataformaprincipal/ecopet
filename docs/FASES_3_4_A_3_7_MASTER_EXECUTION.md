# Fases 3.4 → 3.7 — Master Execution Log

**Início:** 2026-08-09 (BRT)  
**Branch:** `test/fase-3-1-financial-preview`  
**HEAD local:** `5afc0720d71fd92505b837e40260f651dbe61028`  
**Remote:** `origin/test/fase-3-1-financial-preview`  
**Working tree:** sujo (patches assinatura webhook + docs 3.3; scripts `_tmp-*`)  
**Produção:** intocada (sem deploy / merge / DB prod)

---

## Estado de entrada (verificado)

| Item | Evidência |
| ---- | --------- |
| Preview deployment | `ecopet-fzk5m1nx2-ecopet-s-projects.vercel.app` (~Ready) |
| Alias | `https://homolog.eccopet.com` |
| Health | 200 · `database=connected` |
| MP environment | `test` / `TEST_READY` |
| Simulated payments | fail-closed (probe/smoke) |
| FASE 3.1 | Pilot-ready condicional (docs) |
| FASE 3.2 | Gate CONDICIONAL (webhook natural não era prova) |
| FASE 3.3 | **BLOQUEADA** — `SIGNATURE_MISMATCH` natural; runtime `secretLen=64` `secretSha8=9d2804a9` |
| Fase 2/3 suites | último comprovado: 24/24 e 16/16 (pré-gate 3.3) |

### Diagrama financeiro (modelos reais)

```text
ORDER (+ pricing snapshot Float)
  ↓
PAYMENT (amount Float, status String)
  ↓
PROVIDER (Mercado Pago Orders API / sandbox)
  ↓
MpWebhookEvent → pipeline (signature fail-closed)
  ↓
applyInternalPaymentStatus
  ↓
FinancialLedgerEntry (amountCents Int)
  ├─ PAYMENT_RECEIVED
  ├─ PLATFORM_COMMISSION / FIXED_FEE
  ├─ PARTNER_PAYABLE (LedgerAccountType)
  ├─ RESERVE_HOLD → FinancialReserve
  └─ GATEWAY_FEE / TAX_ESTIMATE
  ↓
PartnerPayout / PaymentRefund / FinancialChargeback
  ↓
FinancialReconciliation (+ Run)
  ↓
AuditLog
```

**Notas:** `PartnerPayable` e `PricingSnapshot` não são tabelas — são semântica de ledger + campos snapshot em `Order`/`OrderItem`.

---

## Gates

| Fase | Gate | Status |
| ---- | ---- | ------ |
| 3.4 | Sem double-spend / IDOR crítico / PAID sem provider / inconsistência silenciosa | **PARCIAL** |
| 3.5 | 3.4 sem risco financeiro crítico aberto | **PARCIAL** |
| 3.6 | sem Critical aberto | **PARCIAL** (Critical webhook 3.3) |
| 3.7 | 3.4–3.6 OK + webhook operacional | **PILOTO BLOQUEADO** |

---

## Alterações nesta execução

- Docs: invariantes, resultados 3.4–3.7, runbooks, master report
- Testes: hardening financeiro (unit) + regressão suites
- Código: apenas se bug comprovado com teste (mínimo)
- Sem Production / sem merge / sem commit automático

---

## Bloqueios conhecidos na entrada

1. **P0:** Webhook natural MP não valida assinatura → PAID automático por webhook não comprovado (FASE 3.3).  
2. Working tree com patches locais de assinatura não commitados.  
3. Reconciliação local compara `payment.amount` consigo mesmo para “received” (lacuna de conciliação provider).
