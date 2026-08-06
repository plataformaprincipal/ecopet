import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCommercialAllocation, validateOrderFinancialSnapshot } from "./allocation";

describe("calculateCommercialAllocation", () => {
  it("exemplo documentado R$100 → parceiro 84.50 com reserva fixa", () => {
    const a = calculateCommercialAllocation({
      grossAmount: 100,
      platformPercentage: 10,
      platformFixedFee: 1,
      gatewayFeeEstimated: 2.5,
      reserveAmount: 2,
      taxEstimate: 0,
      pricingVersion: "v1",
      gatewayFeeBearer: "PARTNER",
    });
    assert.equal(a.grossAmountCents, 10000);
    assert.equal(a.platformPercentageAmountCents, 1000);
    assert.equal(a.platformFixedFeeCents, 100);
    assert.equal(a.gatewayFeeEstimatedCents, 250);
    assert.equal(a.reserveAmountCents, 200);
    assert.equal(a.partnerPayableCents, 8450);
  });

  it("imposto estimado não reduz partnerPayable", () => {
    const a = calculateCommercialAllocation({
      grossAmount: 100,
      platformPercentage: 10,
      platformFixedFee: 0,
      gatewayFeeEstimated: 0,
      reserveAmount: 0,
      taxEstimatePercent: 15,
      pricingVersion: "v1",
    });
    assert.equal(a.partnerPayableCents, 9000);
    assert.ok(a.taxEstimateCents > 0);
    assert.equal(a.taxReducesPartnerPayable, false);
  });

  it("rejeita fees que excedem gross", () => {
    assert.throws(() =>
      calculateCommercialAllocation({
        grossAmount: 10,
        platformPercentage: 50,
        platformFixedFee: 10,
        gatewayFeeEstimated: 0,
        pricingVersion: "v1",
      })
    );
  });
});

describe("validateOrderFinancialSnapshot", () => {
  it("aceita snapshot coerente", () => {
    const a = calculateCommercialAllocation({
      grossAmount: 40,
      platformPercentage: 10,
      platformFixedFee: 0,
      gatewayFeeEstimated: 1,
      reserveAmount: 0.5,
      taxEstimate: 0,
      pricingVersion: "v1",
    });
    const snap = a.asOrderFloats;
    const v = validateOrderFinancialSnapshot({
      grossAmount: snap.grossAmount,
      discount: snap.discountAmount,
      platformPercentage: snap.platformPercentage,
      platformFixedFee: snap.platformFixedFee,
      platformFeeAmount: snap.platformFeeAmount,
      gatewayFeeEstimated: snap.gatewayFeeEstimated,
      reserveAmount: snap.reserveAmount,
      taxEstimate: snap.taxEstimate,
      partnerAmount: snap.partnerAmount,
      pricingVersion: snap.pricingVersion,
    });
    assert.equal(v.partnerPayableCents, a.partnerPayableCents);
  });

  it("rejeita pedido sem platformPercentage", () => {
    assert.throws(
      () =>
        validateOrderFinancialSnapshot({
          grossAmount: 40,
          platformPercentage: null,
          platformFixedFee: 0,
          platformFeeAmount: 4,
          gatewayFeeEstimated: 0,
          reserveAmount: 0,
          taxEstimate: 0,
          partnerAmount: 36,
          pricingVersion: "v1",
        }),
      /ORDER_MISSING_FINANCIAL_SNAPSHOT/
    );
  });

  it("rejeita snapshot divergente", () => {
    assert.throws(
      () =>
        validateOrderFinancialSnapshot({
          grossAmount: 100,
          platformPercentage: 10,
          platformFixedFee: 0,
          platformFeeAmount: 10,
          gatewayFeeEstimated: 0,
          reserveAmount: 0,
          taxEstimate: 0,
          partnerAmount: 50,
          pricingVersion: "v1",
        }),
      /ORDER_FINANCIAL_SNAPSHOT_DIVERGENT/
    );
  });
});
