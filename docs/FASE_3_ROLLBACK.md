# Fase 3 — Rollback

## Ordem recomendada

1. **Desativar flags** (Preview/local/Production):
   - `FINANCIAL_LEDGER_ENABLED=false`
   - `PAYOUTS_ENABLED=false`
   - `CHARGEBACKS_ENABLED=false`
   - `RESERVE_ENABLED=false`
   - `DAILY_RECONCILIATION_ENABLED=false`
2. **Interromper liberação de saldo** — não chamar `release-balances` / jobs.
3. **Preservar lançamentos** — não deletar `FinancialLedgerEntry`, payouts, chargebacks, reconciliações.
4. **Bloquear novos pagamentos** (se necessário) — manutenção / `marketplaceEnabled=false` já existente.
5. **Reverter deploy** do Preview para deploy anterior estável (sem Production nesta fase).
6. **Não apagar migration aplicada** `20260806180000_fase3_financial_ledger`.
7. **Conciliação pós-rollback** — executar `reconcilePayment` / revisão admin nos pagamentos do período.

## O que não fazer

- `migrate reset`
- Apagar eventos financeiros históricos
- Editar silenciosamente lançamentos
- Executar repasse real
- Merge em `main` como “undo”

## Recuperação

Com flags religadas, `postLedgerForApprovedPayment` / recovery em webhook idempotente pode completar ledgers faltantes sem duplicar (`idempotencyKey` + `financialLedgerPostedAt`).

## Evidência Fase 3.1 (Preview)

Exercício controlado de desligar/religar `PAYOUTS_ENABLED` em Preview **não executado** — Fase 3.1 bloqueada por isolamento de banco (`docs/FASE_3_1_ENVIRONMENT_ISOLATION.md`). Reexecutar após Preview isolado e deploy funcional.
