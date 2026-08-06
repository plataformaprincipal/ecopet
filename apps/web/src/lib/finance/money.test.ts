import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allocateCents, fromCents, percentOfCents, toCents } from "./money";

describe("money cents", () => {
  it("converte sem float drift crítico", () => {
    assert.equal(toCents(10.1), 1010);
    assert.equal(toCents(0.1 + 0.2), 30);
    assert.equal(fromCents(8450), 84.5);
  });

  it("percentOfCents arredonda", () => {
    assert.equal(percentOfCents(10000, 2.5), 250);
  });

  it("allocateCents residual no último", () => {
    const parts = allocateCents(100, [1, 1, 1]);
    assert.equal(parts.reduce((s, n) => s + n, 0), 100);
    assert.equal(parts[2], 34);
  });
});
