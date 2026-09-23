import assert from "node:assert/strict";
import test from "node:test";
import { validateOnlinePaymentMethod } from "./payment-policy";

test("online payment policy accepts only Pix and card at sight", () => {
  assert.equal(validateOnlinePaymentMethod({ paymentMethodId: "pix" }), null);
  assert.equal(
    validateOnlinePaymentMethod({
      paymentMethodId: "visa",
      paymentMethodType: "credit_card",
      cardToken: "token",
      installments: 1,
    }),
    null,
  );
  assert.equal(
    validateOnlinePaymentMethod({
      paymentMethodId: "visa",
      cardToken: "token",
      installments: 2,
    }),
    "INSTALLMENTS_NOT_ALLOWED",
  );
  assert.equal(
    validateOnlinePaymentMethod({ paymentMethodId: "boleto" }),
    "PAYMENT_METHOD_NOT_ALLOWED",
  );
  assert.equal(
    validateOnlinePaymentMethod({
      paymentMethodId: "visa",
      paymentMethodType: "debit_card",
      cardToken: "token",
    }),
    "PAYMENT_METHOD_NOT_ALLOWED",
  );
});
