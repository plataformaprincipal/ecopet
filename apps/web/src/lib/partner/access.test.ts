import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canAccessPartnerRoute,
  getPartnerAccessLevel,
  partnerRouteRequiresApproval,
} from "./access";

describe("partner access gate", () => {
  it("pending partner is limited", () => {
    assert.equal(
      getPartnerAccessLevel({ accountStatus: "PENDING", verificationStatus: "PENDING" }),
      "limited"
    );
  });

  it("active without APPROVED is limited", () => {
    assert.equal(
      getPartnerAccessLevel({ accountStatus: "ACTIVE", verificationStatus: "PENDING" }),
      "limited"
    );
  });

  it("active + APPROVED + approvedAt is full", () => {
    assert.equal(
      getPartnerAccessLevel({
        accountStatus: "ACTIVE",
        verificationStatus: "APPROVED",
        approvedAt: new Date("2026-01-01"),
      }),
      "full"
    );
  });

  it("active + APPROVED without approvedAt is limited", () => {
    assert.equal(
      getPartnerAccessLevel({
        accountStatus: "ACTIVE",
        verificationStatus: "APPROVED",
        approvedAt: null,
      }),
      "limited"
    );
  });

  it("rejected and suspended are limited", () => {
    assert.equal(
      getPartnerAccessLevel({ accountStatus: "REJECTED", verificationStatus: "REJECTED" }),
      "limited"
    );
    assert.equal(
      getPartnerAccessLevel({ accountStatus: "SUSPENDED", verificationStatus: "APPROVED" }),
      "limited"
    );
  });

  it("limited partner cannot open commercial routes", () => {
    assert.equal(partnerRouteRequiresApproval("/partner/products"), true);
    assert.equal(canAccessPartnerRoute("/partner/products", "limited"), false);
    assert.equal(canAccessPartnerRoute("/partner/profile", "limited"), true);
    assert.equal(canAccessPartnerRoute("/partner/orders", "full"), true);
  });
});
