import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertSimulatedPaymentAllowed,
  isProductionPaymentEnvironment,
  isSimulatedPaymentAllowed,
  isSimulatedPaymentId,
} from "./simulated-payments.js";

describe("simulated-payments", () => {
  it("detects sim_* ids", () => {
    assert.equal(isSimulatedPaymentId("sim_123"), true);
    assert.equal(isSimulatedPaymentId("pay_123"), false);
    assert.equal(isSimulatedPaymentId(null), false);
  });

  it("rejects sim_* in production NODE_ENV", () => {
    const env = { NODE_ENV: "production", ALLOW_SIMULATED_PAYMENTS: "true" };
    assert.equal(isProductionPaymentEnvironment(env), true);
    assert.equal(isSimulatedPaymentAllowed(env), false);
    const result = assertSimulatedPaymentAllowed("sim_1", env);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "SIMULATED_PAYMENT_FORBIDDEN");
  });

  it("rejects sim_* when VERCEL_ENV=production even if NODE_ENV is development", () => {
    const env = {
      NODE_ENV: "development",
      VERCEL_ENV: "production",
      ALLOW_SIMULATED_PAYMENTS: "true",
    };
    assert.equal(isSimulatedPaymentAllowed(env), false);
  });

  it("allows sim_* only outside production with explicit flag", () => {
    const env = { NODE_ENV: "development", ALLOW_SIMULATED_PAYMENTS: "true" };
    assert.equal(isSimulatedPaymentAllowed(env), true);
    assert.equal(assertSimulatedPaymentAllowed("sim_9", env).ok, true);
  });

  it("blocks sim_* in development without flag", () => {
    const env = { NODE_ENV: "development", ALLOW_SIMULATED_PAYMENTS: "" };
    assert.equal(isSimulatedPaymentAllowed(env), false);
    assert.equal(assertSimulatedPaymentAllowed("sim_9", env).ok, false);
  });

  it("allows non-simulated ids always", () => {
    const env = { NODE_ENV: "production" };
    assert.equal(assertSimulatedPaymentAllowed("mp_order_abc", env).ok, true);
  });
});
