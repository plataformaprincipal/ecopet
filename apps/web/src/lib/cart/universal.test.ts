import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ECCOPET_SELLER_ID,
  MP_SPLIT_MODE,
  MULTI_SELLER_STRATEGY,
  exclusivePlanFamily,
  groupBySeller,
  partitionPaymentGroups,
  quantityApplies,
  summarizeCart,
  type UniversalCartLine,
} from "./universal";

function line(partial: Partial<UniversalCartLine> & Pick<UniversalCartLine, "id" | "sellerId" | "sellerName" | "type" | "itemType">): UniversalCartLine {
  return {
    sku: null,
    productId: null,
    sellerType: partial.sellerId === ECCOPET_SELLER_ID ? "ECCOPET" : "PARTNER",
    sellerLogo: null,
    title: partial.title ?? partial.id,
    subtitle: null,
    image: null,
    quantity: 1,
    unitPrice: 10,
    originalPrice: null,
    discount: 0,
    total: 10,
    billingType: "ONE_TIME",
    entitlementType: null,
    petId: null,
    petName: null,
    availability: "AVAILABLE",
    availabilityMessage: null,
    quantityApplies: false,
    detailsHref: null,
    payable: true,
    stock: 1,
    metadata: {},
    name: partial.title ?? partial.id,
    tag: null,
    images: null,
    variant: null,
    checkoutHref: "/checkout",
    ...partial,
  };
}

describe("carrinho universal", () => {
  it("keeps split 1:1 and payment groups strategy", () => {
    assert.equal(MP_SPLIT_MODE, "1:1");
    assert.equal(MULTI_SELLER_STRATEGY, "PAYMENT_GROUPS");
  });

  it("groups visually by seller without splitting the cart", () => {
    const groups = groupBySeller([
      line({ id: "1", sellerId: ECCOPET_SELLER_ID, sellerName: "EccoPet", type: "AI_PRODUCT", itemType: "DIGITAL_AI" }),
      line({ id: "2", sellerId: "p1", sellerName: "Pet Shop X", type: "PHYSICAL_PRODUCT", itemType: "product" }),
      line({ id: "3", sellerId: "p1", sellerName: "Pet Shop X", type: "PHYSICAL_PRODUCT", itemType: "product" }),
      line({ id: "4", sellerId: "p2", sellerName: "Clínica Y", type: "SERVICE", itemType: "QUOTE" }),
    ]);
    assert.equal(groups.length, 3);
    assert.equal(groups[0]?.sellerName, "EccoPet");
    assert.equal(groups[1]?.items.length, 2);
    assert.equal(groups[2]?.sellerName, "Clínica Y");
  });

  it("partitions payment groups per seller and keeps subscriptions separate", () => {
    const drafts = partitionPaymentGroups([
      line({ id: "ai", sellerId: ECCOPET_SELLER_ID, sellerName: "EccoPet", type: "AI_PRODUCT", itemType: "DIGITAL_AI", total: 29.9 }),
      line({ id: "a1", sellerId: "a", sellerName: "A", type: "PHYSICAL_PRODUCT", itemType: "product", total: 40 }),
      line({ id: "b1", sellerId: "b", sellerName: "B", type: "PHYSICAL_PRODUCT", itemType: "product", total: 80 }),
      line({
        id: "one",
        sellerId: ECCOPET_SELLER_ID,
        sellerName: "EccoPet",
        type: "ONE_PLAN",
        itemType: "CATALOG_SKU",
        billingType: "SUBSCRIPTION",
        unitPrice: 39.9,
        total: 39.9,
      }),
    ]);
    assert.equal(drafts.length, 4);
    assert.ok(drafts.some((g) => g.kind === "AI"));
    assert.ok(drafts.some((g) => g.sellerId === "a" && g.kind === "PRODUCT"));
    assert.ok(drafts.some((g) => g.sellerId === "b"));
    assert.ok(drafts.some((g) => g.kind === "SUBSCRIPTION"));
  });

  it("does not let a blocked item corrupt payable totals", () => {
    const summary = summarizeCart([
      line({ id: "ok", sellerId: "a", sellerName: "A", type: "PHYSICAL_PRODUCT", itemType: "product", payable: true, total: 50 }),
      line({
        id: "bad",
        sellerId: "b",
        sellerName: "B",
        type: "PHYSICAL_PRODUCT",
        itemType: "product",
        payable: false,
        availability: "MP_NOT_CONNECTED",
        total: 0,
        unitPrice: 80,
      }),
    ]);
    assert.equal(summary.oneTimeTotal, 50);
    assert.equal(summary.blockedCount, 1);
    assert.equal(summary.payableCount, 1);
  });

  it("keeps exclusive One/Pro families", () => {
    assert.equal(exclusivePlanFamily("ONE-001"), "ONE");
    assert.equal(exclusivePlanFamily("ONE-010"), null);
    assert.equal(exclusivePlanFamily("PRO-001"), "PRO");
    assert.equal(exclusivePlanFamily("AI_ECCOVET"), null);
  });

  it("hides quantity stepper for AI, plans and services", () => {
    assert.equal(quantityApplies("PHYSICAL_PRODUCT"), true);
    assert.equal(quantityApplies("AI_PRODUCT"), false);
    assert.equal(quantityApplies("ONE_PLAN"), false);
    assert.equal(quantityApplies("SERVICE"), false);
  });
});

describe("carrinho universal — fontes", () => {
  const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

  it("não bloqueia addToCart por vendedores diferentes", () => {
    const service = fs.readFileSync(path.join(srcRoot, "lib/cart/cart-service.ts"), "utf8");
    assert.equal(service.includes('throw new Error("MULTI_PARTNER_CART")'), false);
    assert.match(service, /CATALOG_CART_ITEM_TYPE/);
    assert.match(service, /PlanConflictError/);
    assert.match(service, /MULTI_SELLER_STRATEGY/);
  });

  it("checkout universal cria payment groups sem splits 1:N", () => {
    const session = fs.readFileSync(path.join(srcRoot, "lib/orders/checkout-session.ts"), "utf8");
    const route = fs.readFileSync(path.join(srcRoot, "app/api/checkout/route.ts"), "utf8");
    assert.match(session, /checkoutUniversalFromCart/);
    assert.match(session, /MULTI_SELLER_STRATEGY/);
    assert.equal(session.includes("splits["), false);
    assert.match(route, /checkoutUniversalFromCart/);
  });
});
