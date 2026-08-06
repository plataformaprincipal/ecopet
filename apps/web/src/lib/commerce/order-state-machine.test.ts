import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OrderStatus } from "@prisma/client";
import {
  assertOrderTransition,
  canClientCancel,
  canRequestRefund,
  InvalidOrderTransitionError,
} from "./order-state-machine";

describe("order state machine", () => {
  it("allows gateway to mark PAID from PENDING_CONFIRMATION", () => {
    assert.doesNotThrow(() =>
      assertOrderTransition(OrderStatus.PENDING_CONFIRMATION, OrderStatus.PAID, "gateway")
    );
  });

  it("blocks partner setting PAID", () => {
    assert.throws(
      () => assertOrderTransition(OrderStatus.PENDING_CONFIRMATION, OrderStatus.PAID, "partner"),
      InvalidOrderTransitionError
    );
  });

  it("blocks CANCELLED → PAID", () => {
    assert.throws(
      () => assertOrderTransition(OrderStatus.CANCELLED, OrderStatus.PAID, "gateway"),
      InvalidOrderTransitionError
    );
  });

  it("blocks COMPLETED → PENDING_CONFIRMATION", () => {
    assert.throws(
      () =>
        assertOrderTransition(
          OrderStatus.COMPLETED,
          OrderStatus.PENDING_CONFIRMATION,
          "admin"
        ),
      InvalidOrderTransitionError
    );
  });

  it("allows partner fulfillment after PAID", () => {
    assert.doesNotThrow(() =>
      assertOrderTransition(OrderStatus.PAID, OrderStatus.PREPARING, "partner")
    );
  });

  it("client cancel and refund rules", () => {
    assert.equal(canClientCancel(OrderStatus.PENDING_CONFIRMATION), true);
    assert.equal(canClientCancel(OrderStatus.PAID), false);
    assert.equal(canRequestRefund(OrderStatus.PAID), true);
    assert.equal(canRequestRefund(OrderStatus.COMPLETED), false);
  });
});
