# Máquina de Estados — Pedidos (Fase 2)

**Fonte de código:** `apps/web/src/lib/commerce/order-state-machine.ts`  
**Pagamento:** status do `Payment` é separado; `Order.status = PAID` só após confirmação autorizada.

## Atores

| Ator | Papel |
| ---- | ----- |
| `gateway` | Webhook/poll Mercado Pago |
| `system` | Jobs/reconciliação interna |
| `client` | Comprador autenticado |
| `partner` | Vendedor aprovado (fulfillment) |
| `admin` | Operação/plataforma |

## Transições

| Estado atual | Próximo estado | Ator autorizado | Condição |
| ------------ | -------------- | --------------- | -------- |
| PENDING | PENDING_CONFIRMATION | system, client | Checkout cria pedido |
| PENDING | CANCELLED | client, admin, system | Antes do pagamento |
| PENDING_CONFIRMATION | PAID | gateway, system | Webhook/poll válido; valor ok; não cancelado |
| PENDING_CONFIRMATION | CANCELLED | client, partner, admin, system | Cancelamento pré-processamento |
| PENDING_CONFIRMATION | CONFIRMED | partner, admin | Apenas operacional (raro sem PAID) |
| PAID | CONFIRMED | partner, admin, system | Aceite operacional |
| PAID | PREPARING | partner, admin | Início do processamento |
| PAID | CANCELLED | admin, system | Cancelamento administrativo |
| PAID | REFUNDED | gateway, admin, system | Estorno total confirmado |
| PAID | PARTIALLY_REFUNDED | gateway, admin, system | Estorno parcial confirmado |
| CONFIRMED | PREPARING | partner, admin | |
| CONFIRMED | CANCELLED | partner, admin | Política conservadora |
| CONFIRMED | REFUNDED | gateway, admin, system | |
| PREPARING | READY_FOR_PICKUP / READY_PICKUP / SHIPPED / OUT_FOR_DELIVERY | partner, admin | Fulfillment |
| PREPARING | CANCELLED | admin | Revisão administrativa |
| PREPARING | REFUNDED | gateway, admin, system | |
| READY_* | PICKED_UP | partner, admin, client, system | Retirada |
| SHIPPED | OUT_FOR_DELIVERY / DELIVERED | partner, admin, system | |
| OUT_FOR_DELIVERY | DELIVERED | partner, admin, system | |
| DELIVERED / PICKED_UP | COMPLETED | partner, admin, system | |
| COMPLETED | REFUNDED / PARTIALLY_REFUNDED | admin, gateway, system | Exceção pós-conclusão |

## Transições proibidas (exemplos)

| De | Para | Motivo |
| -- | ---- | ------ |
| CANCELLED | PAID | Pedido morto |
| REFUNDED | PROCESSING / PREPARING | Financeiro terminal |
| COMPLETED | PENDING / PENDING_CONFIRMATION | Retrocesso |
| * | PAID | Se ator = client ou partner |

## Regras de cancelamento / reembolso (conservadoras)

| Estado | Ação |
| ------ | ---- |
| PENDING / PENDING_CONFIRMATION | Cancelamento local; sem reembolso; estoque reposto |
| PAID / CONFIRMED / PREPARING | Solicitação de reembolso (gateway sandbox); pedido só vira REFUNDED após confirmação |
| COMPLETED | Sem cancelamento automático |

**Nota:** política ainda depende de validação jurídica/comercial.
