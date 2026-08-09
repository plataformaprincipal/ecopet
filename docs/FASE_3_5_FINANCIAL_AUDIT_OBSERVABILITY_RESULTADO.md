# FASE 3.5 — Auditoria financeira, contábil e observabilidade — Resultado

**Pré-condição:** 3.4 sem double-spend aberto (parcial; gap webhook herdado).  
**Atualizado:** 2026-08-09

---

## Veredito

```text
FASE 3.5 PARCIAL — CONTROLES INSUFICIENTES
```

---

## Definições (formalizadas)

| Conceito | Definição EccoPet |
| -------- | ----------------- |
| GMV | Soma `Order.grossAmount` / totais de pedidos pagos |
| Receita plataforma | `PLATFORM_COMMISSION` + `PLATFORM_FIXED_FEE` (ledger cents) |
| Partner payable | créditos `PARTNER_PAYABLE` AVAILABLE/BLOCKED |
| Reserve | `FinancialReserve` HELD + entry RESERVE_HOLD |
| TPV | volume processado no provider (sandbox) |
| GMV ≠ receita | enforced na alocação (`calculateCommercialAllocation`) |

---

## Plano de contas operacional (ledger)

| entryType | Direção típica | Regra |
| --------- | -------------- | ----- |
| PAYMENT_RECEIVED | CREDIT | 1× por payment |
| PLATFORM_COMMISSION | CREDIT | % snapshot |
| PLATFORM_FIXED_FEE | CREDIT | fee fixo |
| PARTNER_PAYABLE | CREDIT | residual − reserve |
| RESERVE_HOLD | CREDIT/BLOCKED | % reserva |
| GATEWAY_FEE_ESTIMATED | — | bearer PARTNER/PLATFORM |
| Refund reversals | DEBIT/CREDIT | `postLedgerForRefund` |
| PAYOUT | DEBIT payable | sandbox status machine |

---

## Auditoria Order → centavo

Amostra Fase 3 E2E: order → payment APPROVED → 5 ledger entries → blocked → available → payout PAID → refund reversals → chargeback interno → recon `RECONCILED`.

Limitação: caminho natural webhook não posta ledger (3.3).

---

## Conciliação provider

| Check | Status |
| ----- | ------ |
| Status enums de recon | implementados |
| VALUE_MISMATCH order vs payment | parcial |
| Amount provider vs local | **insuficiente** (received = payment.amount) |
| Dashboard MP vs DB automático | não comprovado end-to-end natural |

---

## Observabilidade

| Métrica pedida | Estado |
| -------------- | ------ |
| webhook reject / signature | logs + `payment_webhooks` outcome=rejected |
| payment flow | audit + payment events |
| reconciliation_mismatch | status enum persistido |
| Alertas com thresholds | **não** formalizados como alertas Better Stack dedicados nesta fase |
| Correlation IDs | presentes em logs Vercel |

Logging: redaction de secrets em observability; não logar cartão/token.

---

## Backup / RPO

Supabase homolog: política de backup do provedor — **não** testado restore isolado nesta execução. RPO/RTO não medidos.

---

## Falhas

1. Conciliação sem leitura amount do provider.  
2. Fechamento diário automático (`DAILY_RECONCILIATION_ENABLED`) default off — não dry-run diário completo.  
3. Alert thresholds não codificados como checklist operacional fechada.
