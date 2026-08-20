import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { projectSettlement } from "./settlement";

describe("settlement projection", () => {
  it("never treats estimated payout as paid", () => {
    const s = projectSettlement({
      orderId: "o1",
      partnerId: "p1",
      pricingVersion: "BR-2026.08-v1",
      order: {
        grossAmount: 120,
        platformFeeAmount: 13.49,
        partnerAmount: 106.51,
        reserveAmount: 1.8,
        gatewayFeeEstimated: 4.09,
      },
      payment: { id: "pay1", status: "APPROVED", approvedAt: new Date("2026-08-01T00:00:00Z") },
      ledgerPosted: true,
      partnerPayableCents: 10651,
    });
    assert.equal(s.splitReady, false);
    assert.equal(s.labels.estimatedPartnerAmount, "Estimativa");
    assert.equal(s.actualPartnerAmount, 106.51);
    assert.notEqual(s.payoutStatus, "PAID");
    assert.equal(s.gmv, 120);
    assert.ok(s.platformRevenue > 0);
    assert.ok(s.estimatedPayoutAt);
  });

  it("service uses D+7 eligibility window", () => {
    const approvedAt = new Date("2026-08-01T00:00:00Z");
    const s = projectSettlement({
      orderId: "o2",
      order: {
        pricingSnapshot: { kind: "SERVICE", bookingFeeCents: 490, baseAmountCents: 10000, eccopetRevenueCents: 1690 },
      },
      payment: { id: "pay2", status: "APPROVED", approvedAt },
      ledgerPosted: true,
    });
    const expected = new Date(approvedAt.getTime() + 7 * 86_400_000).toISOString();
    assert.equal(s.estimatedPayoutAt, expected);
  });

  it("refund/chargeback is not reconciled as payable", () => {
    const s = projectSettlement({
      orderId: "o3",
      order: { grossAmount: 50, platformFeeAmount: 6.49, partnerAmount: 43.51 },
      payment: { id: "pay3", status: "CHARGED_BACK", refundedAmount: 50 },
      ledgerPosted: true,
      payoutStatus: "REVERSED",
    });
    assert.equal(s.paymentStatus, "CHARGEBACK");
    assert.equal(s.payoutStatus, "REVERSED");
    assert.equal(s.settlementStatus, "REVERSED");
  });
});
