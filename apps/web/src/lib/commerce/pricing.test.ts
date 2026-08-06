import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateLinePricing, calculateOrderPricing } from "./pricing-pure";

describe("commerce pricing", () => {
  const settings = {
    pricingVersion: "v1",
    platformFeePercent: 10,
    platformFixedFee: 2,
  };

  it("calculates line fee and partner amount", () => {
    const line = calculateLinePricing({ unitPrice: 100, quantity: 2 }, settings);
    assert.equal(line.grossAmount, 200);
    assert.equal(line.platformFeeAmount, 20);
    assert.equal(line.partnerAmount, 180);
    assert.equal(line.pricingVersion, "v1");
  });

  it("applies fixed fee once at order level", () => {
    const order = calculateOrderPricing(
      [
        { unitPrice: 50, quantity: 1 },
        { unitPrice: 50, quantity: 1 },
      ],
      settings
    );
    assert.equal(order.grossAmount, 100);
    assert.equal(order.platformFeeAmount, 12); // 10% + 2 fixed
    assert.equal(order.partnerAmount, 88);
  });

  it("rejects negative price and zero quantity", () => {
    assert.throws(() => calculateLinePricing({ unitPrice: -1, quantity: 1 }, settings));
    assert.throws(() => calculateLinePricing({ unitPrice: 10, quantity: 0 }, settings));
  });
});
