# Auditoria — Precisão monetária

**Branch:** `test/fase-3-1-financial-preview`  
**Data:** 2026-08-09

## Classificação por campo

| Domínio | Campo | Tipo schema | Uso financeiro | Risco |
| ------- | ----- | ----------- | -------------- | ----- |
| Order | total, grossAmount, platformFeeAmount, partnerAmount, reserveAmount, fees | **Float** | Snapshot checkout | MEDIUM — conversão via `toCents` |
| OrderItem | price, amounts | **Float** | Snapshot linha | MEDIUM |
| Payment | amount, refundedAmount | **Float** | Expected local | MEDIUM |
| PaymentRefund | amount | **Float** | Refund | MEDIUM |
| FinancialLedgerEntry | amountCents | **Int** | Ledger | LOW (canônico) |
| FinancialReserve | amountCents | **Int** | Reserve | LOW |
| PartnerPayout | amountCents | **Int** | Payout | LOW |
| FinancialChargeback | amountCents | **Int** | Chargeback | LOW |
| FinancialReconciliation | expected/received AmountCents | **Int** | Recon | LOW |
| PlatformSettings | fee percents | Float | Pricing rules | LOW se só na borda |

## Política

1. Operações financeiras críticas usam **centavos inteiros** (`money.ts`).  
2. Float no Order/Payment é legado de borda — converter com `toCents` antes de ledger/payout/refund/recon.  
3. Não migrar schema Float→Decimal nesta fase (escopo amplo).  
4. Reconciliação provider compara **cents** estritos.

## Validação

- `test:finance` cobre round-trip e alocação em cents.  
- Hardening confirma fechamento percentual + fee + reserve.
