import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeCouponDiscountBrl, type CouponRow } from "./apply-coupon";

function coupon(partial: Partial<CouponRow>): CouponRow {
  return {
    id: "c1",
    code: "ECCOPONTOS10",
    description: "10%",
    discountType: "PERCENT",
    discountValue: 10,
    minOrderCents: null,
    maxRedemptions: 1,
    redemptionCount: 0,
    startsAt: null,
    endsAt: null,
    isActive: true,
    ...partial,
  };
}

describe("computeCouponDiscountBrl", () => {
  it("PERCENT 10 em R$ 150 gera 15", () => {
    assert.equal(computeCouponDiscountBrl(coupon({}), 150), 15);
  });

  it("FIXED não ultrapassa o bruto", () => {
    assert.equal(computeCouponDiscountBrl(coupon({ discountType: "FIXED", discountValue: 200 }), 80), 80);
  });

  it("bruto zero não gera desconto", () => {
    assert.equal(computeCouponDiscountBrl(coupon({}), 0), 0);
  });
});
