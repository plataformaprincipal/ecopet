import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOWED_CLIENT_ACTIONS,
  isAllowedClientAction,
  validateClientAction,
} from "./client-actions";

describe("client-actions allowlist", () => {
  it("aceita ações da allowlist", () => {
    for (const action of ALLOWED_CLIENT_ACTIONS) {
      assert.equal(isAllowedClientAction(action), true);
      const result = validateClientAction(action, { foo: "bar" });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.type, "CLIENT_ACTION");
        assert.equal(result.value.action, action);
        assert.equal(result.value.payload.foo, "bar");
      }
    }
  });

  it("rejeita ação arbitrária", () => {
    const result = validateClientAction("EVAL_SCRIPT", { code: "alert(1)" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /não permitida/i);
    }
    assert.equal(isAllowedClientAction("EVAL_SCRIPT"), false);
    assert.equal(isAllowedClientAction("window.open"), false);
    assert.equal(isAllowedClientAction("DELETE_ACCOUNT"), false);
  });

  it("rejeita payload não-objeto", () => {
    const result = validateClientAction("OPEN_CART", ["bad"]);
    assert.equal(result.ok, false);
  });
});
