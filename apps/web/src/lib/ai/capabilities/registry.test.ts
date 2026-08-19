import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  B2B_CAPABILITIES,
  B2C_CAPABILITIES,
  resolveCapabilityAvailability,
  resolveCapabilitiesForUser,
  getQuickPrompts,
} from "./registry";

const baseCtx = {
  isGuest: false,
  isPartner: false,
  isOng: false,
  isAdmin: false,
  hasPet: true,
  hasGeo: true,
  aiConfigured: true,
};

describe("resolveCapabilityAvailability", () => {
  it("locks login-required capabilities for guests", () => {
    const cap = B2C_CAPABILITIES.find((c) => c.id === "care_navigator")!;
    const resolved = resolveCapabilityAvailability(cap, {
      ...baseCtx,
      isGuest: true,
      hasPet: false,
    });
    assert.equal(resolved.availability, "locked");
    assert.equal(resolved.lockReason, "login");
  });

  it("disables capabilities when AI is not configured", () => {
    const cap = B2C_CAPABILITIES.find((c) => c.id === "concierge")!;
    const resolved = resolveCapabilityAvailability(cap, {
      ...baseCtx,
      aiConfigured: false,
    });
    assert.equal(resolved.availability, "disabled");
  });

  it("marks informational-only capabilities as partial", () => {
    const cap = B2C_CAPABILITIES.find((c) => c.id === "lost_pet")!;
    const resolved = resolveCapabilityAvailability(cap, baseCtx);
    assert.equal(resolved.availability, "partial");
  });

  it("disables B2B capabilities without backend tools", () => {
    const cap = B2B_CAPABILITIES.find((c) => c.id === "pricing_agent")!;
    const resolved = resolveCapabilityAvailability(cap, {
      ...baseCtx,
      isPartner: true,
    });
    assert.equal(resolved.availability, "disabled");
  });
});

describe("resolveCapabilitiesForUser", () => {
  it("returns B2B list only for partners", () => {
    const guest = resolveCapabilitiesForUser({ ...baseCtx, isGuest: true });
    assert.equal(guest.b2b.length, 0);
    assert.ok(guest.b2c.length >= 8);

    const partner = resolveCapabilitiesForUser({ ...baseCtx, isPartner: true });
    assert.ok(partner.b2b.length >= 10);
  });
});

describe("getQuickPrompts", () => {
  it("returns guest prompts for guests", () => {
    const keys = getQuickPrompts({ isGuest: true, isPartner: false });
    assert.ok(keys.some((k) => k.includes("guest")));
  });

  it("returns partner prompts for partners", () => {
    const keys = getQuickPrompts({ isGuest: false, isPartner: true });
    assert.ok(keys.some((k) => k.includes("partner")));
  });
});
