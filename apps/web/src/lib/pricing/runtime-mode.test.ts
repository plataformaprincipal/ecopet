import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyPricingFallback,
  isChargingMemoryFallbackAllowed,
  isPricingMemoryFallbackAllowed,
  isProductionPricingContext,
} from "./runtime-mode";

describe("pricing runtime mode", () => {
  it("forbids memory fallback in Vercel production", () => {
    const env = { VERCEL_ENV: "production", NODE_ENV: "production", PRICING_MEMORY_FALLBACK: "true" };
    assert.equal(isProductionPricingContext(env), true);
    assert.equal(isPricingMemoryFallbackAllowed(env), false);
    assert.equal(isChargingMemoryFallbackAllowed(env), false);
    assert.equal(classifyPricingFallback(env), "production forbidden");
  });

  it("allows test fallback", () => {
    const env = { NODE_ENV: "test" };
    assert.equal(isPricingMemoryFallbackAllowed(env), true);
    assert.equal(isChargingMemoryFallbackAllowed(env), true);
    assert.equal(classifyPricingFallback(env), "test fallback");
  });

  it("allows explicit dev memory fallback but not charging unless test", () => {
    const env = { NODE_ENV: "development", PRICING_MEMORY_FALLBACK: "true" };
    assert.equal(isPricingMemoryFallbackAllowed(env), true);
    assert.equal(isChargingMemoryFallbackAllowed(env), false);
    assert.equal(classifyPricingFallback(env), "dev fallback");
  });
});
