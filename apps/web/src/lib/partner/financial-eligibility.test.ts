import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePartnerFinancialDetails } from "./financial-eligibility-policy";

test("partner financial eligibility", async (t) => {
  await t.test("requires financial details before publication", () => {
    assert.deepEqual(evaluatePartnerFinancialDetails(null), {
      status: "NOT_CONFIGURED",
      canPublish: false,
    });
  });

  await t.test("keeps incomplete receiving data pending", () => {
    assert.deepEqual(
      evaluatePartnerFinancialDetails({
        paymentMethods: ["Pix"],
        pixKey: "cliente@banco",
      }),
      { status: "PENDING", canPublish: false },
    );
  });

  await t.test("accepts complete Pix receiving data", () => {
    assert.deepEqual(
      evaluatePartnerFinancialDetails({
        paymentMethods: ["Pix"],
        pixKeyType: "EMAIL",
        pixKey: "cliente@banco",
      }),
      { status: "ACTIVE", canPublish: true },
    );
  });

  await t.test("honors an explicit blocked status", () => {
    assert.deepEqual(
      evaluatePartnerFinancialDetails({
        status: "BLOCKED",
        paymentMethods: ["Pix"],
      }),
      { status: "BLOCKED", canPublish: false },
    );
  });
});
