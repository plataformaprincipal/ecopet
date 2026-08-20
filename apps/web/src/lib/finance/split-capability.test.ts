import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateSplitCapability,
  marketplaceParamsForOrdersApi,
} from "./split-capability";

describe("split capability", () => {
  it("never reports splitReady even with oauth env and flag", () => {
    const cap = evaluateSplitCapability({
      MERCADO_PAGO_CLIENT_ID: "app",
      MERCADO_PAGO_CLIENT_SECRET: "secret",
      MP_MARKETPLACE_SPLIT_ENABLED: "1",
    });
    assert.equal(cap.splitReady, false);
    assert.equal(cap.decision, "SPLIT_REQUIRES_MP_ENABLEMENT");
    assert.equal(cap.topology, "ONE_ORDER_ONE_PARTNER");
    assert.equal(cap.marketplaceFeeCompatibleWithCurrentCheckout, false);
    assert.deepEqual(marketplaceParamsForOrdersApi(cap), {});
  });

  it("records missing oauth credentials", () => {
    const cap = evaluateSplitCapability({});
    assert.equal(cap.sellerOAuthConfigured, false);
    assert.ok(cap.reasons.some((r) => r.includes("CLIENT_ID")));
  });
});
