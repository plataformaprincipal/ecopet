import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateMarketplaceSplit,
  evaluateSplitCapability,
  marketplaceParamsForOrdersApi,
  proportionalApplicationFee,
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

  it("marks order split ready only with connected collector and fee", () => {
    const cap = evaluateMarketplaceSplit({
      source: {
        MERCADO_PAGO_CLIENT_ID: "app",
        MERCADO_PAGO_CLIENT_SECRET: "secret",
        MP_MARKETPLACE_SPLIT_ENABLED: "1",
      },
      partnerConnection: { status: "CONNECTED", mpUserId: "123456" },
      applicationFeeAmount: 12.5,
      transactionAmount: 100,
    });
    assert.equal(cap.splitReady, true);
    assert.equal(cap.decision, "SPLIT_READY");
    assert.equal(cap.mpProduct, "payments_api_marketplace");
    assert.equal(cap.collectorId, "123456");
  });

  it("keeps splitReady false without partner connection", () => {
    const cap = evaluateMarketplaceSplit({
      source: {
        MERCADO_PAGO_CLIENT_ID: "app",
        MERCADO_PAGO_CLIENT_SECRET: "secret",
        MP_MARKETPLACE_SPLIT_ENABLED: "1",
      },
      partnerConnection: { status: "NOT_CONNECTED", mpUserId: null },
      applicationFeeAmount: 12.5,
      transactionAmount: 100,
    });
    assert.equal(cap.splitReady, false);
    assert.equal(cap.mpProduct, "orders_api_platform_collector");
  });

  it("blocks multi-partner carts", () => {
    const cap = evaluateMarketplaceSplit({
      source: {
        MERCADO_PAGO_CLIENT_ID: "app",
        MERCADO_PAGO_CLIENT_SECRET: "secret",
        MP_MARKETPLACE_SPLIT_ENABLED: "1",
      },
      partnerConnection: { status: "CONNECTED", mpUserId: "123456" },
      multiPartnerCart: true,
      applicationFeeAmount: 12.5,
      transactionAmount: 100,
    });
    assert.equal(cap.splitReady, false);
    assert.equal(cap.decision, "ARCHITECTURE_BLOCKED");
  });

  it("activates order split from partner connection even if platform flag unset", () => {
    const cap = evaluateMarketplaceSplit({
      source: {
        MERCADO_PAGO_CLIENT_ID: "app",
        MERCADO_PAGO_CLIENT_SECRET: "secret",
      },
      partnerConnection: { status: "CONNECTED", mpUserId: "123456" },
      applicationFeeAmount: 12.5,
      transactionAmount: 100,
    });
    assert.equal(cap.splitReady, true);
  });

  it("honors explicit platform kill-switch", () => {
    const cap = evaluateMarketplaceSplit({
      source: {
        MERCADO_PAGO_CLIENT_ID: "app",
        MERCADO_PAGO_CLIENT_SECRET: "secret",
        MP_MARKETPLACE_SPLIT_ENABLED: "0",
      },
      partnerConnection: { status: "CONNECTED", mpUserId: "123456" },
      applicationFeeAmount: 12.5,
      transactionAmount: 100,
    });
    assert.equal(cap.splitReady, false);
  });

  it("computes proportional application_fee on refund", () => {
    assert.equal(
      proportionalApplicationFee({ originalAmount: 100, refundAmount: 50, applicationFee: 10 }),
      5
    );
  });
});
