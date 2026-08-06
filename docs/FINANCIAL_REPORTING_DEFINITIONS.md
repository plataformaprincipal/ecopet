# Definições de relatórios financeiros (Fase 3)

| Métrica | Definição | Não confundir com |
| ------- | --------- | ----------------- |
| **GMV** | Soma dos valores pagos pelos clientes (Payment/Order gross) | Receita EccoPet |
| **Receita bruta EccoPet** | Soma ledger `PLATFORM_COMMISSION` + `PLATFORM_FIXED_FEE` (créditos) | GMV |
| **Receita líquida estimada** | Receita bruta − taxas gateway (est./ajustes) | Caixa disponível |
| **Taxas do gateway** | Soma lançamentos GATEWAY_FEE_* | Taxa real confirmada isolada |
| **Valores de parceiros** | Soma créditos `PARTNER_PAYABLE` | Repasse pago |
| **Reservas** | `FinancialReserve` status HELD | Saldo disponível |
| **Reembolsos** | Soma `REFUND` no ledger / PaymentRefund | Cancelamento sem estorno |
| **Chargebacks** | Soma/abertura `FinancialChargeback` + lançamentos | Disputa MP sem ledger |
| **Saldos pendentes** | PARTNER_PAYABLE POSTED (não liberado) | Disponível |
| **Saldos bloqueados** | PARTNER_PAYABLE BLOCKED + RESERVE_HOLD | Disponível |
| **Saldos disponíveis** | PARTNER_PAYABLE AVAILABLE sem payout | Repasse concluído |
| **Repasses** | `PartnerPayout` (sandbox nesta fase) | Transferência bancária real |
| **Divergências** | `FinancialReconciliation` ≠ RECONCILED | Erro de UI |

Timezone de exportação: **UTC**.
