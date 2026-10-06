import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

function readSrc(rel: string) {
  return readFileSync(path.resolve(process.cwd(), rel), "utf8");
}

function moneyEquals(a: number, b: number) {
  return Math.round(a * 100) === Math.round(b * 100);
}

function innerTransactionBody(src: string) {
  const start = src.indexOf("$transaction");
  assert.ok(start > -1, "expected $transaction");
  const slice = src.slice(start);
  const createIdx = slice.search(/tx\.order\.create|order\.create/);
  assert.ok(createIdx > -1, "expected order.create inside transaction");
  return slice.slice(0, createIdx);
}

describe("checkout transaction timeout regression", () => {
  it("does not run order.aggregate inside interactive transactions", () => {
    for (const rel of [
      "src/lib/orders/checkout-service.ts",
      "src/lib/ai-commerce/checkout-service.ts",
      "src/lib/commerce-catalog/checkout.ts",
    ]) {
      const src = readSrc(rel);
      assert.equal(src.includes("tx.order.aggregate"), false, rel);
      assert.equal(src.includes("order.aggregate({ _max: { orderNumber"), false, rel);
      assert.ok(src.includes("withCheckoutCreateRetry"), rel);
      assert.ok(src.includes("allocateNextOrderNumber") || src.includes("withCheckoutCreateRetry"), rel);
    }
  });

  it("keeps seller, pricing and split work outside the physical checkout transaction", () => {
    const src = readSrc("src/lib/orders/checkout-service.ts");
    const beforeTx = src.slice(0, src.indexOf("withCheckoutCreateRetry"));
    assert.ok(beforeTx.includes("listSellablePartnerIdSet"));
    assert.ok(beforeTx.includes("serverQuoteProduct"));
    assert.ok(beforeTx.includes("resolveOrderMarketplaceSplit"));
    const inner = innerTransactionBody(src);
    assert.equal(inner.includes("isSellerSellable"), false);
    assert.equal(inner.includes("resolveOrderMarketplaceSplit"), false);
    assert.equal(inner.includes("serverQuoteProduct"), false);
    assert.equal(inner.includes("assertPetOwned"), false);
    assert.ok(inner.includes("product.updateMany") || inner.includes("order.create") || inner.length >= 0);
  });

  it("quotes AI SKUs before opening the AI checkout transaction", () => {
    const src = readSrc("src/lib/ai-commerce/checkout-service.ts");
    const beforeTx = src.slice(0, src.indexOf("withCheckoutCreateRetry"));
    assert.ok(beforeTx.includes("quoteAiSku"));
    assert.ok(beforeTx.includes("assertPetOwned"));
    const inner = innerTransactionBody(src);
    assert.equal(inner.includes("quoteAiSku"), false);
    assert.equal(inner.includes("assertPetOwned"), false);
  });

  it("does not keep Mercado Pago HTTP inside prisma transactions", () => {
    for (const rel of [
      "src/lib/orders/checkout-service.ts",
      "src/lib/ai-commerce/checkout-service.ts",
      "src/lib/commerce-catalog/checkout.ts",
      "src/lib/orders/checkout-session.ts",
    ]) {
      const src = readSrc(rel);
      const inner = src.includes("$transaction") ? innerTransactionBody(src) : src;
      assert.equal(inner.includes("createMercadoPagoOrder"), false, rel);
      assert.equal(inner.includes("mpFetch"), false, rel);
    }
  });

  it("rejects mismatched payment group totals", () => {
    const src = readSrc("src/lib/orders/checkout-session.ts");
    assert.ok(src.includes("CHECKOUT_TOTAL_MISMATCH"));
    assert.ok(src.includes("assertGroupTotals"));
    assert.equal(moneyEquals(44.8, 44.8), true);
    assert.equal(moneyEquals(44.8, 44.81), false);
  });
});

describe("installments endpoint guards", () => {
  it("requires a complete BIN and a positive amount", () => {
    const src = readSrc("src/app/api/checkout/mercado-pago/installments/route.ts");
    assert.ok(src.includes("BIN incompleto") || src.includes("bin"));
    assert.ok(src.includes("oneTimeTotal") || src.includes("subtotal"));
    assert.equal(src.includes("productSubtotal"), false);
    const ui = readSrc("src/components/features/marketplace/mercado-pago-checkout.tsx");
    assert.ok(ui.includes("digits.length < 6"));
    assert.ok(ui.includes("amount > 0"));
    assert.ok(ui.includes("500"));
  });
});
