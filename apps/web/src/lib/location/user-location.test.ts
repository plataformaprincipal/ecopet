import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { locationIsKnown, locationNeedsPrompt, type UserLocationState } from "./user-location";

describe("user location states", () => {
  it("unknown precisa de prompt e não quebra consumidores", () => {
    const state: UserLocationState = "unknown";
    assert.equal(locationNeedsPrompt(state), true);
    assert.equal(locationIsKnown(state), false);
  });

  it("granted e manual são conhecidos", () => {
    assert.equal(locationIsKnown("granted"), true);
    assert.equal(locationIsKnown("manual"), true);
    assert.equal(locationNeedsPrompt("granted"), false);
  });

  it("denied não é conhecido — Marketplace usa fallback manual", () => {
    assert.equal(locationIsKnown("denied"), false);
    assert.equal(locationNeedsPrompt("denied"), false);
  });

  it("requesting não dispara novo prompt automático", () => {
    assert.equal(locationNeedsPrompt("requesting"), false);
    assert.equal(locationIsKnown("requesting"), false);
  });

  it("unknown não vira granted só porque existe geo da IA", () => {
    assert.equal(locationIsKnown("unknown"), false);
    assert.equal(locationNeedsPrompt("unknown"), true);
  });
});
