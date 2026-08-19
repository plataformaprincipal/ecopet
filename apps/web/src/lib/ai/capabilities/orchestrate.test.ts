import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterToolsByAllowlist,
  isToolAllowedForCapability,
  normalizeCapabilityId,
  resolveServerCapability,
} from "./orchestrate";
import { getCapability } from "./registry";

const clientBase = {
  role: "CLIENT" as const,
  hasPet: true,
  hasGeo: true,
  aiConfigured: true,
  isGuest: false,
};

describe("normalizeCapabilityId", () => {
  it("accepts hyphen aliases used in deep links", () => {
    assert.equal(normalizeCapabilityId("lost-pet"), "lost_pet");
    assert.equal(normalizeCapabilityId("content-studio"), "content_studio");
  });
});

describe("resolveServerCapability", () => {
  it("falls back to concierge when capabilityId is missing", () => {
    const decision = resolveServerCapability({ ...clientBase });
    assert.equal(decision.status, "ok");
    if (decision.status === "ok") {
      assert.equal(decision.capability.id, "concierge");
      assert.equal(decision.fallbackFromInvalid, undefined);
    }
  });

  it("falls back to concierge for unknown capability ids (not a privileged agent)", () => {
    const decision = resolveServerCapability({
      ...clientBase,
      capabilityId: "finance-agent-not-real",
    });
    assert.equal(decision.status, "ok");
    if (decision.status === "ok") {
      assert.equal(decision.capability.id, "concierge");
      assert.equal(decision.fallbackFromInvalid, true);
      assert.ok(!decision.allowedTools.includes("consult_partner_summary"));
    }
  });

  it("denies CLIENT using pricing-agent", () => {
    const decision = resolveServerCapability({
      ...clientBase,
      capabilityId: "pricing_agent",
    });
    assert.equal(decision.status, "denied");
    if (decision.status === "denied") {
      assert.ok(decision.code === "CAPABILITY_LOCKED" || decision.code === "CAPABILITY_DISABLED");
    }
  });

  it("denies CLIENT using finance-agent", () => {
    const decision = resolveServerCapability({
      ...clientBase,
      capabilityId: "finance_agent",
    });
    assert.equal(decision.status, "denied");
  });

  it("locks guest out of care-navigator", () => {
    const decision = resolveServerCapability({
      role: "GUEST",
      isGuest: true,
      hasPet: false,
      hasGeo: false,
      aiConfigured: true,
      capabilityId: "care_navigator",
    });
    assert.equal(decision.status, "denied");
    if (decision.status === "denied") {
      assert.equal(decision.code, "CAPABILITY_LOCKED");
      assert.equal(decision.lockReason, "login");
    }
  });

  it("allows partner sales-agent when tools exist", () => {
    const decision = resolveServerCapability({
      role: "PARTNER",
      isGuest: false,
      hasPet: false,
      hasGeo: false,
      aiConfigured: true,
      capabilityId: "sales_agent",
    });
    assert.equal(decision.status, "ok");
    if (decision.status === "ok") {
      assert.equal(decision.capability.id, "sales_agent");
      assert.ok(decision.allowedTools.includes("consult_products"));
    }
  });

  it("denies partner pricing-agent because backend tools are missing", () => {
    const decision = resolveServerCapability({
      role: "PARTNER",
      isGuest: false,
      hasPet: false,
      hasGeo: false,
      aiConfigured: true,
      capabilityId: "pricing_agent",
    });
    assert.equal(decision.status, "denied");
    if (decision.status === "denied") {
      assert.equal(decision.code, "CAPABILITY_DISABLED");
    }
  });
});

describe("tool allowlist", () => {
  it("Shopping Agent cannot run partner/admin tools", () => {
    const cap = getCapability("shopping_agent")!;
    assert.equal(isToolAllowedForCapability(cap.tools, "consult_partner_summary"), false);
    assert.equal(isToolAllowedForCapability(cap.tools, "consult_products"), true);
    assert.equal(isToolAllowedForCapability(cap.tools, "add_to_cart"), true);
  });

  it("Care Navigator cannot run financial/cart tools", () => {
    const cap = getCapability("care_navigator")!;
    assert.equal(isToolAllowedForCapability(cap.tools, "add_to_cart"), false);
    assert.equal(isToolAllowedForCapability(cap.tools, "consult_orders"), false);
    assert.equal(isToolAllowedForCapability(cap.tools, "consult_pet_vaccinations"), true);
  });

  it("Content Studio cannot run purchase tools", () => {
    const cap = getCapability("content_studio")!;
    assert.equal(isToolAllowedForCapability(cap.tools, "add_to_cart"), false);
    assert.equal(isToolAllowedForCapability(cap.tools, "consult_products"), false);
  });

  it("Lost Pet cannot run B2B tools", () => {
    const cap = getCapability("lost_pet")!;
    assert.equal(isToolAllowedForCapability(cap.tools, "consult_partner_summary"), false);
    assert.equal(isToolAllowedForCapability(cap.tools, "add_to_cart"), false);
  });

  it("filters planned tools to the allowlist", () => {
    const filtered = filterToolsByAllowlist(
      [
        { name: "consult_products" },
        { name: "consult_partner_summary" },
        { name: "add_to_cart" },
      ],
      ["consult_products", "add_to_cart"]
    );
    assert.deepEqual(
      filtered.map((t) => t.name),
      ["consult_products", "add_to_cart"]
    );
  });
});
