# Payment topology EccoPet

**CASE A — 1 checkout : 1 order : 1 partner : 1 payment.**

Evidence:

- `addToCart()` throws `MULTI_PARTNER_CART` (`apps/web/src/lib/cart/cart-service.ts`).
- Checkout revalida um único `partnerId` (`apps/web/src/lib/orders/checkout-service.ts`).
- `Order.partnerId` é escalar; itens copiam o mesmo parceiro.
- Cobrança Mercado Pago: `POST /v1/orders` com **token da plataforma** (`create-checkout-order.ts` + `client.ts`).

Não há carrinho multi-seller no caminho de pagamento. O store Zustand do marketplace não é fonte de verdade do checkout.

## Split

Checkout Transparente / API Orders **não recebe** `marketplace_fee` / `collector_id` do seller.

`splitReady` permanece **false** até:

1. Conta Mercado Pago marketplace habilitada;
2. OAuth do vendedor (`MERCADO_PAGO_CLIENT_ID` / `SECRET`);
3. Produto de cobrança compatível com collector do parceiro.

Decisão atual: `SPLIT_REQUIRES_MP_ENABLEMENT`.

Não se deve bloquear UX multi-seller “para esconder” o split: o carrinho 1:1 já é a topologia real.
