# Pricing Engine

Serviço puro em `apps/web/src/lib/pricing/engine.ts`. Dinheiro em **centavos inteiros**.

## Ordem do cálculo

1. Resolver `PricingVersion` ACTIVE e vigente.
2. Resolver SKU / pricing mode.
3. Resolver preço-base (seller / prestador). Frontend nunca é autoridade.
4. Aplicar contract override (vigência + aprovação + piso 8%/10%).
5. Comissão percentual.
6. Taxa fixa (pedido) / booking fee / urgent fee (somente se evento elegível).
7. Validar promoção (vigência, status, escopo).
8. Validar cupom (infraestrutura Prisma existente).
9. Guardrail de margem (SaaS/IA 60%, assinatura 45%, Ads 35%).
10. Reserva 1,5% do GMV/base.
11. PSP **Estimativa** (premissa 3% + R$ 0,49) — não é taxa contratual.
12. Payout **Estimativa** (após hold; after-release separado).
13. Arredondamento `Math.round` em centavos.
14. Quote.
15. Snapshot imutável gravado em `Order.pricingSnapshot` / `Appointment.pricingSnapshot`.

## Fórmulas de lançamento

### Produto (`COM-PROD`)

```
commission = round(sellerPrice * 10%)
fixedFee   = R$ 1,49 por pedido (não por linha)
eccopet    = commission + fixedFee
reserve    = round(GMV * 1,5%)
pspEst     = round(customer * 3%) + R$ 0,49
payoutHold = sellerPrice - eccopet - pspEst - reserve
```

Payout do parceiro **nunca** pode ser `< 0`.

### Serviço / saúde (`COM-SERV`)

```
commission = round(providerBase * 12%)
bookingFee = R$ 4,90 (tutor)
urgentFee  = R$ 14,90 somente se serviço elegível + evento real
customer   = providerBase + bookingFee + urgentFee
```

Booking fee **não** é escondida: detalhe no resumo.

## Snapshot histórico

Pedido/agendamento antigo **não** recalcula com tabela vigente. Ledger usa `pricingSnapshot` quando presente.

## Idempotência

Checkout já exige `idempotencyKey`. Quote não gera lançamento financeiro; só o pagamento/ledger o faz.
