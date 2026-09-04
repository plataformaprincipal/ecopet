import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assembleQuoteFinancials,
  clampPartnerDiscount,
  linesAfterDiscount,
  quoteSubtotal,
  validateQuoteLines,
} from "./quotes-math";
import { isNativeMarketplaceChatEnabled } from "./flag";

describe("commerce-chat quotes math", () => {
  it("ignores frontend claimed total", () => {
    const items = validateQuoteLines([{ description: "Banho", quantity: 2, unitPrice: 50 }]);
    const result = assembleQuoteFinancials({
      items,
      discountAmount: 10,
      shippingAmount: 15,
      claimedTotal: 0.01,
      engine: {
        customerAmountCents: 9000,
        eccopetCommissionCents: 900,
        estimatedTaxProvisionCents: 100,
        discountCents: 0,
        pricingVersion: "BR-2026.08-v1",
        snapshot: { ok: true },
      },
    });
    assert.equal(result.subtotalAmount, 100);
    assert.equal(result.discountAmount, 10);
    assert.equal(result.shippingAmount, 15);
    assert.equal(result.totalAmount, 105);
    assert.notEqual(result.totalAmount, 0.01);
  });

  it("clamps discount and shipping", () => {
    assert.equal(clampPartnerDiscount(100, 999), 100);
    assert.equal(clampPartnerDiscount(100, -5), 0);
    assert.equal(quoteSubtotal([{ description: "A", quantity: 3, unitPrice: 10 }]), 30);
  });

  it("applies proportional discount before engine lines", () => {
    const lines = linesAfterDiscount(
      [
        { description: "A", quantity: 1, unitPrice: 80 },
        { description: "B", quantity: 1, unitPrice: 20 },
      ],
      10
    );
    assert.equal(lines[0]!.unitPrice, 72);
    assert.equal(lines[1]!.unitPrice, 18);
  });
});

describe("NATIVE_MARKETPLACE_CHAT flag", () => {
  it("defaults on", () => {
    assert.equal(isNativeMarketplaceChatEnabled({}), true);
  });
  it("can be turned off", () => {
    assert.equal(isNativeMarketplaceChatEnabled({ NATIVE_MARKETPLACE_CHAT: "false" }), false);
  });
});
