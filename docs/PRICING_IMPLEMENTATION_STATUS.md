# Status da Precificação — Fase 2

**Fonte:** `PlatformSettings` + `apps/web/src/lib/commerce/pricing.ts`  
**Versão padrão:** `v1`

## Valores implementados

| Campo | Onde | Significado |
| ----- | ---- | ----------- |
| `pricingVersion` | PlatformSettings, Order, OrderItem | Versão da regra no momento da compra |
| `platformFeePercent` | PlatformSettings (default 10) | % contábil da plataforma |
| `platformFixedFee` | PlatformSettings (default 0) | Taxa fixa contábil por pedido |
| `grossAmount` | Order, OrderItem | Bruto (qty × unitPrice) |
| `platformFeeAmount` | Order, OrderItem | Taxa estimada da plataforma |
| `partnerAmount` | Order, OrderItem | Valor contábil esperado do parceiro |
| `total` | Order | Total cobrado do cliente (= gross nesta fase, frete 0) |
| `price` | OrderItem | Snapshot do preço unitário |

## Valores ainda não implementados

| Item | Status |
| ---- | ------ |
| Split / marketplace fee real no MP | Não |
| Repasse automático ao parceiro | Não |
| Antecipação | Não |
| Carteira financeira de payout | Não |
| `paymentFeeEstimate` persistido dedicado | Parcial (metadata MP; não matriz completa) |
| Frete dinâmico no total | Não (shippingCost default 0) |
| Cupons / descontos versionados | Não no checkout Next oficial |

## Regras hardcoded restantes

- Moeda fixa `BRL`
- Defaults `platformFeePercent=10`, `platformFixedFee=0`, `pricingVersion=v1` se `PlatformSettings` ausente
- Checkout Next limita `deliveryMethod` a `DELIVERY_LOCAL` | `PICKUP_LOCAL`
- Um parceiro por carrinho/pedido

## Comissão calculada vs repasse efetivo

| Conceito | Nesta fase |
| -------- | ---------- |
| `platformFeeAmount` / `partnerAmount` | Estimativa contábil gravada no pedido |
| Split Mercado Pago | **Não** configurado |
| Prova de pagamento ao parceiro | **Não** — apenas valor esperado |
| Alteração retroativa | **Impedida** pelo snapshot; editar produto não muda OrderItem |

Admin pode alterar percentuais em `PlatformSettings` apenas com autorização admin existente; pedidos antigos mantêm sua `pricingVersion` e valores snapshotted.
