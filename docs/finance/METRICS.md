# Métricas comerciais EccoPet

Definições em `apps/web/src/lib/finance/metrics.ts`. Pedido antigo **não** é recalculado com a tabela vigente.

| Métrica | Significado | Fonte |
| ------- | ----------- | ----- |
| GMV | Volume transacionado (preço seller × qtd) | `Order.grossAmount` ou snapshot `baseAmountCents` |
| platformRevenue | Receita própria EccoPet | `Order.platformFeeAmount` / `eccopetRevenueCents` |
| partnerEconomicValue | Valor econômico do parceiro | `Order.partnerAmount` / `partnerEconomicAmountCents` |
| estimatedPayout | Estimativa após reserva/PSP | snapshot `estimatedPayoutCents` |
| refundAmount | Estornos reais | `Payment` / `Refund` |
| payout liquidado | Só ledger `paid` | `getPartnerBalances` |

GMV ≠ receita EccoPet ≠ payout ≠ saldo disponível.

Split Mercado Pago: `splitReady=false` (`SPLIT_REQUIRES_MP_ENABLEMENT`). Não simular repasse automático. Ver `docs/finance/PAYMENT_TOPOLOGY.md`.

Payment APPROVED ≠ payout disponível. D+14 produto / D+7 serviço são janelas de elegibilidade, não transferência automática.
