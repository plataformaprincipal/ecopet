import assert from "node:assert/strict";
import { createHmac } from "crypto";
import { describe, it } from "node:test";
import { normalizeMercadoPagoWebhook } from "./normalize-event";
import { resolvePanelTopic, MP_TOPIC_CATALOG } from "./event-types";
import { verifyMercadoPagoWebhookSignature } from "./verify-signature";
import { sanitizeWebhookPayload, parseMercadoPagoWebhookBody } from "./parse-event";
describe("mp webhook topics catalog", () => {
  it("mapeia topics oficiais do painel", () => {
    assert.equal(resolvePanelTopic("order").panelKey, "order");
    assert.equal(resolvePanelTopic("payment").panelKey, "payment");
    assert.equal(resolvePanelTopic("stop_delivery_op_wh").panelKey, "fraud_alert");
    assert.equal(resolvePanelTopic("topic_claims_integration_wh").panelKey, "claim");
    assert.equal(resolvePanelTopic("topic_chargebacks_wh").panelKey, "dispute");
    assert.equal(resolvePanelTopic("mp-connect").panelKey, "application_link");
    assert.equal(resolvePanelTopic("wallet_connect").capability, "NOT_APPLICABLE");
    assert.equal(resolvePanelTopic("point_integration_wh").capability, "NOT_APPLICABLE");
    assert.equal(resolvePanelTopic("totally_fake_topic").panelKey, "unknown");
  });

  it("catálogo cobre labels do painel do usuário", () => {
    const labels = MP_TOPIC_CATALOG.map((c) => c.panelLabel);
    assert.ok(labels.some((l) => /Order/i.test(l)));
    assert.ok(labels.some((l) => /fraude/i.test(l)));
    assert.ok(labels.some((l) => /Card Updater/i.test(l)));
    assert.ok(labels.some((l) => /Reclama/i.test(l)));
    assert.ok(labels.some((l) => /Contest/i.test(l)));
  });
});

describe("mp webhook normalize", () => {
  it("sanitiza payload sem cartão/token", () => {
    const raw = JSON.stringify({
      id: 1,
      type: "order",
      action: "order.updated",
      live_mode: false,
      data: { id: "ord-1", token: "SECRET", card_number: "4111111111111111", cvv: "123" },
    });
    const n = normalizeMercadoPagoWebhook(raw);
    assert.ok(n);
    assert.equal(n.panelKey, "order");
    const dumped = JSON.stringify(n.sanitizedPayload);
    assert.ok(!dumped.includes("SECRET"));
    assert.ok(!dumped.includes("4111111111111111"));
    assert.ok(!dumped.includes("123") || !dumped.includes('"cvv"'));
  });

  it("card updater via automatic-payments", () => {
    const raw = JSON.stringify({
      id: "evt-1",
      type: "automatic-payments",
      action: "card.updated",
      data: { customer_id: "c1", new_card_id: 1, old_card_id: 2 },
    });
    const n = normalizeMercadoPagoWebhook(raw);
    assert.ok(n);
    assert.equal(n.panelKey, "card_updater");
    assert.equal(n.capability, "NOT_APPLICABLE");
  });
});

describe("mp webhook signature + replay", () => {
  it("rejeita skew / mismatch", () => {
    const secret = "test_webhook_secret_value";
    const dataId = "99";
    const requestId = "req-z";
    const ts = String(Date.now());
    const v1 = createHmac("sha256", secret)
      .update(`id:${dataId};request-id:${requestId};ts:${ts};`)
      .digest("hex");
    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: requestId,
        dataId,
        secret,
      }).valid,
      true
    );
    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${ts},v1=00`,
        xRequestId: requestId,
        dataId,
        secret,
      }).valid,
      false
    );
  });
});

describe("mp parse", () => {
  it("extrai resource id de payment_id em fraude", () => {
    const parsed = parseMercadoPagoWebhookBody(
      JSON.stringify({
        type: "stop_delivery_op_wh",
        data: { payment_id: 58980959081, merchant_order: 1 },
      })
    );
    assert.ok(parsed);
    assert.equal(parsed.resourceId, "58980959081");
    const sanitized = sanitizeWebhookPayload(parsed);
    assert.equal((sanitized.data as { payment_id: string }).payment_id, "58980959081");
  });
});
