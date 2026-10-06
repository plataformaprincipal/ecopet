import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

function readSrc(rel: string) {
  return readFileSync(path.resolve(process.cwd(), rel), "utf8");
}

describe("ciclo operacional comercial", () => {
  it("não recria checkout, split, ledger, OAuth nem seller gate", () => {
    const pay = readSrc("src/lib/mercado-pago/create-checkout-order.ts");
    assert.ok(pay.includes("sellerRequiresMarketplaceSplit"));
    assert.ok(pay.includes("createMercadoPagoOrder"));
    const cart = readSrc("src/lib/cart/universal.ts");
    assert.equal(cart.includes('MP_SPLIT_MODE = "1:1"'), true);
    assert.ok(cart.includes("PAYMENT_GROUPS"));
  });

  it("parceiro aceita/recusa com motivo e timeout de aceite", () => {
    const accept = readSrc("src/app/api/partner/orders/[orderId]/accept/route.ts");
    assert.ok(accept.includes("partnerAcceptOrder"));
    const reject = readSrc("src/app/api/partner/orders/[orderId]/reject/route.ts");
    assert.ok(reject.includes("SELLER_REJECT_REASONS"));
    const timeout = readSrc("src/lib/orders/seller-confirmation.ts");
    assert.ok(timeout.includes("SELLER_CONFIRMATION_EXPIRED"));
    assert.ok(timeout.includes("expireUnconfirmedPartnerOrders"));
  });

  it("pós-venda, denúncia, políticas e rastreio existem", () => {
    assert.ok(readSrc("src/lib/commerce/aftercare.ts").includes("openAftercareCase"));
    assert.ok(readSrc("src/app/api/commerce/reports/route.ts").includes("contentReport.create"));
    assert.ok(readSrc("src/app/legal/cliente/trocas/page.tsx").includes("Trocas"));
    assert.ok(readSrc("src/app/legal/cliente/reembolso/page.tsx").includes("Reembolso"));
    const status = readSrc("src/app/api/partner/orders/[orderId]/status/route.ts");
    assert.ok(status.includes("trackingUrl"));
  });

  it("orçamento versiona e avaliações da EccoPet ficam fora", () => {
    const quotes = readSrc("src/lib/commerce-chat/quotes.ts");
    assert.ok(quotes.includes("reviseQuote"));
    assert.ok(quotes.includes("version: { increment: 1 }"));
    const reviews = readSrc("src/app/api/reviews/route.ts");
    assert.ok(reviews.includes("não recebem avaliações públicas"));
    assert.ok(reviews.includes("verifiedPurchase"));
  });

  it("testes não disparam pagamento LIVE", () => {
    const live = readSrc("src/lib/commerce/checkout-live.test.ts");
    assert.equal(live.includes("https://api.mercadopago.com"), false);
    assert.ok(live.includes("MERCADO_PAGO_ACCESS_TOKEN"));
  });
});
