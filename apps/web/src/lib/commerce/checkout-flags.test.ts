import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertCheckoutEnabled,
  CheckoutDisabledError,
  isCheckoutEnabled,
} from "./checkout-flags";

describe("CHECKOUT_ENABLED kill switch", () => {
  it("default true quando ausente", () => {
    assert.equal(isCheckoutEnabled({}), true);
  });

  it("aceita true/1/yes/on", () => {
    assert.equal(isCheckoutEnabled({ CHECKOUT_ENABLED: "true" }), true);
    assert.equal(isCheckoutEnabled({ CHECKOUT_ENABLED: "1" }), true);
    assert.equal(isCheckoutEnabled({ CHECKOUT_ENABLED: "yes" }), true);
    assert.equal(isCheckoutEnabled({ CHECKOUT_ENABLED: "on" }), true);
  });

  it("bloqueia false/0/no/off", () => {
    assert.equal(isCheckoutEnabled({ CHECKOUT_ENABLED: "false" }), false);
    assert.equal(isCheckoutEnabled({ CHECKOUT_ENABLED: "0" }), false);
    assert.equal(isCheckoutEnabled({ CHECKOUT_ENABLED: "off" }), false);
  });

  it("fail-closed em valor inválido", () => {
    assert.equal(isCheckoutEnabled({ CHECKOUT_ENABLED: "maybe" }), false);
  });

  it("assert lança CHECKOUT_DISABLED", () => {
    assert.throws(
      () => assertCheckoutEnabled({ CHECKOUT_ENABLED: "false" }),
      (e: unknown) => e instanceof CheckoutDisabledError && e.message === "CHECKOUT_DISABLED"
    );
  });
});
