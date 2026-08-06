# Modelo contábil lógico — EccoPet (Fase 3)

## Princípios

1. **GMV ≠ receita** — GMV é o valor pago pelo cliente.
2. **Valor do parceiro = obrigação** — não é receita da EccoPet.
3. **Pagamento ≠ repasse** — PAID cria saldo; repasse é fluxo separado (sandbox nesta fase).
4. **Estimativa ≠ real** — `gatewayFeeEstimated` / `taxEstimated` vs valores actual.
5. **Ledger append-only** — correções geram novos lançamentos.
6. **Valores críticos em centavos (Int)**.

## Contas

Modelo Prisma: `LedgerAccount` (não confundir com `FinancialAccount` do Gestor interno).

| Conta | Owner | Uso |
| ----- | ----- | --- |
| PLATFORM_REVENUE | platform | Comissão % + taxa fixa |
| PLATFORM_RECEIVABLE | platform | Pagamento recebido (GMV) |
| PARTNER_PAYABLE | partnerId | Obrigação ao parceiro |
| GATEWAY_FEES | platform | Taxas gateway (est./real/ajuste) |
| RESERVE | partnerId | Reserva bloqueada |
| REFUNDS | platform | Reembolsos |
| CHARGEBACKS | platform | Chargebacks |
| TAX_ESTIMATE | platform | Imposto estimado operacional |

## Exemplo ilustrativo (não é preço padrão do sistema)

```text
Cliente paga: R$ 100,00
Comissão EccoPet: R$ 10,00
Taxa fixa: R$ 1,00
Taxa gateway estimada: R$ 2,50
Reserva: R$ 2,00
Valor devido ao parceiro: R$ 84,50
```

Equação (bearer gateway = PARTNER; imposto não reduz parceiro):

```text
100,00 - 10,00 - 1,00 - 2,50 - 2,00 = 84,50
```

### Lançamentos

| entryType | Conta | Dir | Centavos | Status |
| --------- | ----- | --- | -------- | ------ |
| PAYMENT_RECEIVED | PLATFORM_RECEIVABLE | CREDIT | 10000 | POSTED |
| PLATFORM_COMMISSION | PLATFORM_REVENUE | CREDIT | 1000 | POSTED |
| PLATFORM_FIXED_FEE | PLATFORM_REVENUE | CREDIT | 100 | POSTED |
| GATEWAY_FEE_ESTIMATED | GATEWAY_FEES | DEBIT | 250 | POSTED |
| PARTNER_PAYABLE | PARTNER_PAYABLE | CREDIT | 8450 | BLOCKED |
| RESERVE_HOLD | RESERVE (parceiro) | CREDIT | 200 | BLOCKED |
| TAX_ESTIMATE | TAX_ESTIMATE | DEBIT | (se > 0) | POSTED |

## Política provisória

Documentada em `FASE_3_FINANCIAL_CURRENT_STATE.md` §6. Não é política comercial definitiva.
