import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveIdempotencyKey, isMutatingAiTool } from "./tool-idempotency-utils";

describe("tool-idempotency", () => {
  it("identifica writes mutáveis", () => {
    assert.equal(isMutatingAiTool("add_to_cart"), true);
    assert.equal(isMutatingAiTool("consult_products"), false);
  });

  it("gera chave estável para mesmos parâmetros", () => {
    const a = deriveIdempotencyKey("u1", "add_to_cart", { productId: "p1", quantity: 1 });
    const b = deriveIdempotencyKey("u1", "add_to_cart", { productId: "p1", quantity: 1 });
    assert.equal(a, b);
  });

  it("prefere clientKey quando fornecida", () => {
    const key = deriveIdempotencyKey("u1", "add_to_cart", { productId: "p1" }, "confirm-msg-1");
    assert.equal(key, "confirm-msg-1");
  });
});
