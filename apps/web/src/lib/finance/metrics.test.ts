import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { metricsFromOrderRow, metricsFromPricingSnapshot, sumCommerceMetrics } from "./metrics";

describe("commerce metrics", () => {
  it("reads GMV and platform revenue from official snapshot cents", () => {
    const m = metricsFromPricingSnapshot({
      baseAmountCents: 12000,
      eccopetRevenueCents: 1349,
      partnerEconomicAmountCents: 10651,
      discountCents: 0,
      reserveCents: 180,
      estimatedPayoutCents: 10062,
    });
    assert.equal(m?.gmv, 120);
    assert.equal(m?.platformRevenue, 13.49);
    assert.equal(m?.partnerEconomicValue, 106.51);
    assert.equal(m?.estimatedPayout, 100.62);
  });

  it("ignores commerce-allocation fallback snapshots", () => {
    assert.equal(metricsFromPricingSnapshot({ fallback: "commerce-allocation", pricingVersion: "v1" }), null);
  });

  it("does not reprice stored order fields when snapshot is absent", () => {
    const m = metricsFromOrderRow({
      grossAmount: 200,
      platformFeeAmount: 21.49,
      partnerAmount: 170,
      total: 200,
    });
    assert.equal(m.gmv, 200);
    assert.equal(m.platformRevenue, 21.49);
    assert.equal(m.partnerEconomicValue, 170);
  });

  it("aggregates without treating GMV as platform revenue", () => {
    const sum = sumCommerceMetrics([
      { grossAmount: 100, platformFeeAmount: 11.49, partnerAmount: 80, total: 100 },
      { grossAmount: 50, platformFeeAmount: 6.49, partnerAmount: 40, total: 50 },
    ]);
    assert.equal(sum.gmv, 150);
    assert.equal(sum.platformRevenue, 17.98);
    assert.notEqual(sum.gmv, sum.platformRevenue);
  });
});
