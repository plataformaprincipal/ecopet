import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";
import { buildTalkJsConversationId, assertPersonaCanMessage } from "./server";
import {
  getTalkJsHealthSnapshot,
  isMessagingFlagEnabled,
  listMessagingFeatureFlags,
  toTalkJsUserId,
} from "./config";
import {
  verifyTalkJsWebhookSignature,
  hashWebhookPayload,
  buildWebhookIdempotencyKey,
} from "./webhook-security";

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

  it("differs by context including ORDER", () => {
    const general = buildTalkJsConversationId({
      contextType: "GENERAL",
      contextId: "general",
      userAId: "a",
      userBId: "b",
    });
    const order = buildTalkJsConversationId({
      contextType: "ORDER",
      contextId: "ord-1",
      userAId: "a",
      userBId: "b",
    });
    assert.notEqual(general, order);
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

describe("talkjs config / flags", () => {
  it("lista flags e health sanitizado sem secrets", () => {
    const flags = listMessagingFeatureFlags();
    assert.equal(typeof flags.talkjs, "boolean");
    assert.equal(typeof flags.webhooks, "boolean");
    const health = getTalkJsHealthSnapshot();
    assert.ok(!("secretKey" in health));
    assert.ok(!JSON.stringify(health).includes("sk_"));
    assert.equal(toTalkJsUserId("user_abc"), "user_abc");
  });
});

describe("talkjs webhook security", () => {
  it("gera idempotency key estável", () => {
    const hash = hashWebhookPayload('{"type":"message.sent"}');
    const key = buildWebhookIdempotencyKey("msg1", hash);
    assert.match(key, /^talkjs:msg1:/);
  });

  it("valida HMAC quando strict", () => {
    const prevSecret = process.env.TALKJS_SECRET_KEY;
    const prevWh = process.env.TALKJS_WEBHOOK_SECRET;
    const prevEnv = process.env.TALKJS_ENVIRONMENT;
    const prevVerify = process.env.TALKJS_WEBHOOK_VERIFY;
    const prevFlag = process.env.MSG_FLAG_WEBHOOKS;

    process.env.TALKJS_SECRET_KEY = "test_secret_for_hmac";
    process.env.TALKJS_WEBHOOK_SECRET = "test_secret_for_hmac";
    process.env.TALKJS_ENVIRONMENT = "test";
    process.env.TALKJS_WEBHOOK_VERIFY = "1";
    process.env.MSG_FLAG_WEBHOOKS = "true";

    const rawBody = '{"type":"message.sent","data":{}}';
    const timestamp = String(Date.now());
    const signature = createHmac("sha256", "test_secret_for_hmac")
      .update(`${timestamp}.${rawBody}`)
      .digest("hex")
      .toUpperCase();

    const ok = verifyTalkJsWebhookSignature({ rawBody, signature, timestamp });
    assert.equal(ok.ok, true);

    const bad = verifyTalkJsWebhookSignature({
      rawBody,
      signature: "DEADBEEF",
      timestamp,
    });
    assert.equal(bad.ok, false);

    if (prevSecret === undefined) delete process.env.TALKJS_SECRET_KEY;
    else process.env.TALKJS_SECRET_KEY = prevSecret;
    if (prevWh === undefined) delete process.env.TALKJS_WEBHOOK_SECRET;
    else process.env.TALKJS_WEBHOOK_SECRET = prevWh;
    if (prevEnv === undefined) delete process.env.TALKJS_ENVIRONMENT;
    else process.env.TALKJS_ENVIRONMENT = prevEnv;
    if (prevVerify === undefined) delete process.env.TALKJS_WEBHOOK_VERIFY;
    else process.env.TALKJS_WEBHOOK_VERIFY = prevVerify;
    if (prevFlag === undefined) delete process.env.MSG_FLAG_WEBHOOKS;
    else process.env.MSG_FLAG_WEBHOOKS = prevFlag;
  });

  it("flag webhooks é boolean", () => {
    assert.equal(typeof isMessagingFlagEnabled("webhooks"), "boolean");
  });
});
