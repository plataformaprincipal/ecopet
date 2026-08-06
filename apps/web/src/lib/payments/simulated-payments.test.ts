import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertSimulatedPaymentAllowed,
  isAuthorizedPaidSource,
  isSimulatedPaymentAllowed,
  isSimulatedPaymentId,
} from "./simulated-payments";

describe("web simulated-payments", () => {
  it("rejects sim_* in production", () => {
    const env = { NODE_ENV: "production", ALLOW_SIMULATED_PAYMENTS: "true" };
    assert.equal(isSimulatedPaymentAllowed(env), false);
    const r = assertSimulatedPaymentAllowed("sim_x", env);
    assert.equal(r.ok, false);
  });

  it("allows simulation only with flag outside production", () => {
    assert.equal(
      isSimulatedPaymentAllowed({ NODE_ENV: "test", ALLOW_SIMULATED_PAYMENTS: "1" }),
      true
    );
    assert.equal(
      isSimulatedPaymentAllowed({ NODE_ENV: "test", ALLOW_SIMULATED_PAYMENTS: "0" }),
      false
    );
  });

  it("authorized paid sources exclude client/frontend", () => {
    assert.equal(isAuthorizedPaidSource("webhook"), true);
    assert.equal(isAuthorizedPaidSource("poll"), true);
    assert.equal(isAuthorizedPaidSource("api"), false);
    assert.equal(isAuthorizedPaidSource("wallet"), false);
    assert.equal(isAuthorizedPaidSource("frontend"), false);
    assert.equal(isAuthorizedPaidSource("client"), false);
  });

  it("detects simulated ids", () => {
    assert.equal(isSimulatedPaymentId("sim_1"), true);
    assert.equal(isSimulatedPaymentId("real"), false);
  });
});
