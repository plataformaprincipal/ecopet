# Fase 2 — Arquitetura Comercial Oficial

**Data:** 2026-08-06  
**Branch:** `feat/fase-2-fluxo-comercial-minimo`  
**Provedor de pagamento oficial:** Mercado Pago (sandbox)  
**Regra de pedido:** um pedido por parceiro (carrinho multi-parceiro rejeitado)

## Decisão arquitetural

```text
Browser → Next.js Route Handler → Service → Prisma → Supabase
```

O Express **não** permanece como segunda fonte capaz de mutar pedido, pagamento, estoque, carrinho, produto, serviço ou status financeiro. Mutações comerciais Express retornam **410** `COMMERCIAL_API_MOVED`.

## Domínios

| Domínio | Endpoint oficial | Implementação | Express legado | Status |
| ------- | ---------------- | ------------- | -------------- | ------ |
| Produtos (parceiro) | `/api/partner/products` | Next Route Handler | `/api/products`, `/api/marketplace/partner/products` | MIGRAR PARA NEXT.JS (feito; Express mutações DESATIVAR) |
| Serviços (parceiro) | `/api/partner/services` | Next Route Handler | `/api/services`, marketplace-partner | MIGRAR PARA NEXT.JS (feito; Express mutações DESATIVAR) |
| Carrinho | `/api/cart`, `/api/cart/items` | Next + `cart-service` | `/api/cart` | MIGRAR PARA NEXT.JS (feito; Express mutações DESATIVAR) |
| Checkout | `/api/checkout` | Next + `checkout-service` | `/api/orders/checkout` | MIGRAR PARA NEXT.JS (feito; Express mutações DESATIVAR) |
| Pedidos cliente | `/api/client/orders` | Next | `/api/orders` | MIGRAR PARA NEXT.JS (feito) |
| Pedidos parceiro | `/api/partner/orders` | Next + state machine | `/api/marketplace/partner/orders` | MIGRAR PARA NEXT.JS (feito) |
| Pagamento sandbox | `/api/checkout/mercado-pago/*` | Next + MP Orders API | — | Implementação oficial |
| Webhook | `/api/webhooks/mercado-pago` | Next + HMAC + idempotência | — | Fonte única de PAID |
| Cancelamento | `/api/client/orders/[id]/cancel` | Next | Express refund/cancel | MIGRAR PARA NEXT.JS |
| Reembolso | `/api/orders/[id]/refund` | Next + MP refunds | Express | MIGRAR PARA NEXT.JS |
| Admin pedidos | `/api/admin/orders` | Next | gestor Express | MANTER TEMPORARIAMENTE (leitura admin Next) |
| Notificações | `createInternalNotification` | Next service | `/api/notifications` | MANTER TEMPORARIAMENTE (não bloqueia checkout) |
| Stripe | — | stub | — | DESATIVAR no fluxo mínimo |
| Wallet checkout | — | fora do fluxo mínimo | `/api/wallet` | MANTER TEMPORARIAMENTE (não oficial comercial) |

## Decisões registradas

1. **Um pedido por parceiro** — evita split operacional/financeiro inadequado.
2. **Estoque reduzido no checkout** (update condicional `stock >= qty`) — reposição em cancelamento pré-pagamento / falha de pagamento.
3. **PAID somente via `webhook` ou `poll`** (consulta server-side ao gateway). Create MP não marca PAID.
4. **Snapshot de precificação** em `Order`/`OrderItem` (`grossAmount`, `platformFeeAmount`, `partnerAmount`, `pricingVersion`).
5. **`partnerAmount` é contábil** — não prova de repasse/split.
6. **Carrinho de produto no detalhe** usa `/api/cart` (Zustand deixa de ser fonte do checkout).
7. **Serviços no MVP:** CRUD/publicação no Next; checkout de serviço no carrinho permanece fora do funil produto (OrderItem já tem `serviceId` para evolução).

## Fallback

Não há fallback silencioso para Express nas mutações comerciais. Cliente recebe 410 com `successor`.
