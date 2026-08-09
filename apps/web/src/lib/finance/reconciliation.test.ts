import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyAmountReconciliation } from "./reconciliation-classify";

describe("FASE 3.5 provider-aware amount reconciliation", () => {
  it("igual → null (deixa RECONCILED)", () => {
    assert.equal(
      classifyAmountReconciliation({
        expectedAmountCents: 5000,
        providerAmountCents: 5000,
        providerFetchOk: true,
        providerUnavailable: false,
      }),
      null
    );
  });

  it("R$0,01 diferente → VALUE_MISMATCH", () => {
    assert.equal(
      classifyAmountReconciliation({
        expectedAmountCents: 5000,
        providerAmountCents: 5001,
        providerFetchOk: true,
        providerUnavailable: false,
      }),
      "VALUE_MISMATCH"
    );
  });

  it("diferença maior → VALUE_MISMATCH", () => {
    assert.equal(
      classifyAmountReconciliation({
        expectedAmountCents: 5000,
        providerAmountCents: 6000,
        providerFetchOk: true,
        providerUnavailable: false,
      }),
      "VALUE_MISMATCH"
    );
  });

  it("provider sem amount → MANUAL_REVIEW", () => {
    assert.equal(
      classifyAmountReconciliation({
        expectedAmountCents: 5000,
        providerAmountCents: null,
        providerFetchOk: false,
        providerUnavailable: false,
      }),
      "MANUAL_REVIEW"
    );
  });

  it("provider timeout/unavailable → MANUAL_REVIEW", () => {
    assert.equal(
      classifyAmountReconciliation({
        expectedAmountCents: 5000,
        providerAmountCents: null,
        providerFetchOk: false,
        providerUnavailable: true,
      }),
      "MANUAL_REVIEW"
    );
  });

  it("igualdade estrita em centavos", () => {
    assert.equal(
      classifyAmountReconciliation({
        expectedAmountCents: 5000,
        providerAmountCents: 5000,
        providerFetchOk: true,
        providerUnavailable: false,
      }),
      null
    );
  });
});
