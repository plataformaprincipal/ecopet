import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { refundableBalance } from "./refunds";

describe("refundableBalance", () => {
  it("APPROVED sem estornos → saldo = amount", () => {
    assert.equal(refundableBalance({ amount: 100, refundedAmount: 0, status: "APPROVED" }), 100);
  });

  it("parcial → saldo restante", () => {
    assert.equal(
      refundableBalance({ amount: 100, refundedAmount: 30, status: "PARTIALLY_REFUNDED" }),
      70
    );
  });

  it("totalmente estornado → 0", () => {
    assert.equal(
      refundableBalance({ amount: 100, refundedAmount: 100, status: "REFUNDED" }),
      0
    );
  });

  it("pendente → 0", () => {
    assert.equal(refundableBalance({ amount: 50, refundedAmount: 0, status: "PENDING" }), 0);
  });

  it("não permite saldo negativo por float", () => {
    assert.equal(
      refundableBalance({ amount: 10, refundedAmount: 10.004, status: "PARTIALLY_REFUNDED" }),
      0
    );
  });
});
