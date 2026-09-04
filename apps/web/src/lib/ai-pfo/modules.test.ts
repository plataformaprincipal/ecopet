import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PFO_AI_MODULES, pfoAiPurchasableCounts } from "./modules";
import { AI_COMMERCE_PRODUCTS } from "@/lib/ai-commerce/catalog";

describe("PFO AI add-ons", () => {
  it("keeps 13 official specialists separate from 33 PFO modules", () => {
    assert.equal(AI_COMMERCE_PRODUCTS.length, 13);
    assert.equal(PFO_AI_MODULES.length, 33);
    const specialistSkus = new Set<string>(AI_COMMERCE_PRODUCTS.map((p) => p.sku));
    for (const mod of PFO_AI_MODULES) {
      assert.equal(specialistSkus.has(mod.sku), false, mod.sku);
    }
  });

  it("makes digital PFO modules purchasable except human radiology", () => {
    const counts = pfoAiPurchasableCounts();
    assert.equal(counts.purchasable, 32);
    assert.equal(counts.total, 33);
    const c05 = PFO_AI_MODULES.find((m) => m.sku === "AI-C05")!;
    assert.equal(c05.professionalAct, true);
    assert.ok(c05.blockedReason);
  });
});
