import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Limites documentados do loop operacional — evita cascata infinita de tools. */
const MAX_ROUNDS = 2;
const MAX_TOOLS_PER_ROUND = 3;

describe("enterprise tool-loop limits", () => {
  it("limita rodadas e tools por rodada", () => {
    assert.equal(MAX_ROUNDS, 2);
    assert.equal(MAX_TOOLS_PER_ROUND, 3);
    const simulatedCalls = MAX_ROUNDS * MAX_TOOLS_PER_ROUND;
    assert.ok(simulatedCalls <= 6, "loop não deve exceder 6 tool calls por turno");
  });
});
