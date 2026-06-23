import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTalkJsConversationId, assertPersonaCanMessage } from "./server";

describe("buildTalkJsConversationId", () => {
  it("is deterministic regardless of user order", () => {
    const a = buildTalkJsConversationId({
      contextType: "PRODUCT",
      contextId: "prod-1",
      userAId: "user-b",
      userBId: "user-a",
    });
    const b = buildTalkJsConversationId({
      contextType: "PRODUCT",
      contextId: "prod-1",
      userAId: "user-a",
      userBId: "user-b",
    });
    assert.equal(a, b);
    assert.match(a, /^ecopet_PRODUCT_prod-1_/);
  });

  it("differs by context", () => {
    const general = buildTalkJsConversationId({
      contextType: "GENERAL",
      contextId: "general",
      userAId: "a",
      userBId: "b",
    });
    const product = buildTalkJsConversationId({
      contextType: "PRODUCT",
      contextId: "p1",
      userAId: "a",
      userBId: "b",
    });
    assert.notEqual(general, product);
  });
});

describe("assertPersonaCanMessage", () => {
  it("allows CLIENT with PARTNER and ONG", () => {
    assert.equal(assertPersonaCanMessage("CLIENT", "PARTNER"), true);
    assert.equal(assertPersonaCanMessage("CLIENT", "ONG"), true);
  });

  it("allows PARTNER and ONG with CLIENT", () => {
    assert.equal(assertPersonaCanMessage("PARTNER", "CLIENT"), true);
    assert.equal(assertPersonaCanMessage("ONG", "CLIENT"), true);
  });

  it("blocks CLIENT with CLIENT", () => {
    assert.equal(assertPersonaCanMessage("CLIENT", "CLIENT"), false);
  });

  it("blocks PARTNER with PARTNER", () => {
    assert.equal(assertPersonaCanMessage("PARTNER", "PARTNER"), false);
  });
});
