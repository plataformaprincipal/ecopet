# FASE 6.1 — Money precision remediation (sem migração ampla)

## Campos Float (schema)

Order.total, Payment.amount, Refund/PaymentRefund amounts, reserves/payouts relacionados — vários `Float` no Prisma.

## Classificação

| Área | Tipo | Risco | Boundary |
| ---- | ---- | ----- | -------- |
| Ledger / allocation / percent | cents Int via `toCents` / `percentOfCents` | controlado se boundary respeitado | **SIM** — testes money |
| Order.total / Payment.amount | Float storage | drift 1¢ se ops em float | converter com `toCents` antes ledger/recon/payout |
| Reconciliation | compara cents | OK após provider-aware | expected vs provider cents |
| Checkout display | Float→toFixed(2) | UX only | não usa para ledger |

## Decisão

**Não migrar schema nesta fase.**  
Provar conversão: `npm run test:finance` (money + recon classify).  
Migração Decimal/Int = dívida P2 documentada.
