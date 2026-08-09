# FASE 3.4 — Invariantes financeiros obrigatórios

**Branch:** `test/fase-3-1-financial-preview`  
**Modelo:** ledger em centavos (`amountCents`) + snapshot Order em Float (legado)

---

## Invariantes

| ID | Invariante | Enforçamento esperado |
| -- | ---------- | --------------------- |
| FIN-001 | Order não vira PAID sem confirmação válida do provider | `applyInternalPaymentStatus` + `isAuthorizedPaidSource` + assinatura webhook |
| FIN-002 | Um pagamento externo → uma confirmação financeira | `Order.financialLedgerPostedAt` + unique ledger keys |
| FIN-003 | `PAYMENT_RECEIVED` não duplica | `idempotencyKey` unique + P2002 recovery |
| FIN-004 | Ledger fecha matematicamente (alocação snapshot) | `validateOrderFinancialSnapshot` / `calculateCommercialAllocation` |
| FIN-005 | Partner payable não duplica | key `…:PARTNER_PAYABLE` |
| FIN-006 | ReserveHold não duplica | key `…:reserve` / `…:RESERVE_HOLD` |
| FIN-007 | Refund acumulado ≤ valor pago | refunds + `refundedAmount` + ledger reversals |
| FIN-008 | Payout ≤ saldo disponível | `payout.ts` saldo AVAILABLE |
| FIN-009 | Saldo reservado não pode ser pago | reserve HELD vs AVAILABLE |
| FIN-010 | Evento duplicado não movimenta dinheiro | MpWebhook unique + ledger idempotency |
| FIN-011 | Evento antigo não regride estado terminal | guards APPROVED→downgrade bloqueados |
| FIN-012 | Falha parcial atômica ou recuperável | `$transaction` + recovery ledger se PAID sem post |
| FIN-013 | Retry idempotente | keys + `alreadyPosted` |
| FIN-014 | Saldos reconstruíveis pelo ledger | `balances.ts` / reporting |
| FIN-015 | GMV ≠ receita EccoPet | alocação commission/fee vs gross |
| FIN-016 | Valor do parceiro ≠ receita plataforma | `PARTNER_PAYABLE` vs `PLATFORM_*` |
| FIN-017 | Centavos exatos | `money.ts` integer cents |
| FIN-018 | Sem depender só de memória de instância | DB uniques + eventos persistidos |
| FIN-019 | External reference corresponde ao pedido | `ecopet_{orderId}` + link-payment |
| FIN-020 | Provider ID único/consistente | conflict check em `apply-payment-status` |

---

## State machines (resumo)

**Payment:** CREATED → PENDING/PROCESSING → APPROVED \| REJECTED \| CANCELLED \| EXPIRED → REFUNDED / PARTIALLY_REFUNDED / CHARGED_BACK  

**Order (pagamento):** PENDING* → PAID → REFUNDED / PARTIALLY_REFUNDED (fulfillment separado)

**PartnerPayout:** PENDING → APPROVED → PROCESSING → PAID (FAILED/CANCELLED/REVERSED)

**FinancialReserve:** HELD → RELEASED \| CONSUMED \| CANCELLED

**FinancialChargeback:** OPEN → UNDER_REVIEW → WON \| LOST \| CANCELLED

---

## Riscos de fronteira

1. Order/Payment usam **Float**; ledger usa **Int cents** — conversão só via `toCents`.  
2. Webhook natural com assinatura inválida bloqueia FIN-001 via canal preferencial.  
3. Reconciliação atual: `receivedAmountCents = toCents(payment.amount)` (não lê provider) — limita detecção VALUE_MISMATCH externo.
