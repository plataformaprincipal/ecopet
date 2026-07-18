import assert from "node:assert/strict";
import { createHmac } from "crypto";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  getMercadoPagoEnvironment,
  getMercadoPagoPublicConfig,
  getMercadoPagoSanitizedStatus,
  getMercadoPagoServerConfig,
  isMercadoPagoConfigured,
  isMercadoPagoTestMode,
} from "./config";
import { hashPayload } from "./crypto-utils";
import { mapMpOrderStatusToInternal, isTerminalApproved, isTerminalFailure } from "./status";
import { verifyMercadoPagoWebhookSignature } from "./webhook-signature";

describe("mercado-pago config", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("variável ausente → não configurado", () => {
    delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    assert.equal(isMercadoPagoConfigured(), false);
    assert.equal(getMercadoPagoServerConfig(), null);
    assert.equal(getMercadoPagoSanitizedStatus().status, "NOT_CONFIGURED");
  });

  it("placeholder não conta como configurado", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "TEST-xxxxxxxxx";
    assert.equal(isMercadoPagoConfigured(), false);
  });

  it("configuração válida em modo test", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "TEST-abc123validtokenvalue";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "TEST-pk-valid-key-value";
    process.env.MERCADO_PAGO_ENVIRONMENT = "test";
    assert.equal(isMercadoPagoConfigured(), true);
    assert.equal(isMercadoPagoTestMode(), true);
    assert.equal(getMercadoPagoEnvironment(), "test");
    const pub = getMercadoPagoPublicConfig();
    assert.equal(pub.configured, true);
    assert.ok(pub.publicKey.startsWith("TEST-"));
    assert.equal(getMercadoPagoSanitizedStatus().status, "TEST_READY");
  });

  it("token TEST força test mesmo com environment=production", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "TEST-abc123validtokenvalue";
    process.env.MERCADO_PAGO_ENVIRONMENT = "production";
    assert.equal(getMercadoPagoEnvironment(), "test");
  });

  it("status sanitizado nunca inclui access token", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "TEST-supersecret-token-xyz";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "TEST-pk-ok";
    const status = getMercadoPagoSanitizedStatus();
    const dumped = JSON.stringify(status);
    assert.ok(!dumped.includes("supersecret"));
    assert.ok(!dumped.includes("TEST-supersecret-token-xyz"));
  });

  it("getMercadoPagoServerConfig não roda em phase-production-build", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "TEST-abc123validtokenvalue";
    process.env.NEXT_PHASE = "phase-production-build";
    assert.equal(getMercadoPagoServerConfig(), null);
    delete process.env.NEXT_PHASE;
  });
});

describe("mercado-pago status mapping", () => {
  it("processed + accredited → APPROVED", () => {
    assert.equal(mapMpOrderStatusToInternal("processed", "accredited"), "APPROVED");
    assert.equal(isTerminalApproved("APPROVED"), true);
  });

  it("failed / rejected → REJECTED", () => {
    assert.equal(mapMpOrderStatusToInternal("failed", "cc_rejected"), "REJECTED");
    assert.equal(isTerminalFailure("REJECTED"), true);
  });

  it("refunded / charged_back", () => {
    assert.equal(mapMpOrderStatusToInternal("refunded"), "REFUNDED");
    assert.equal(mapMpOrderStatusToInternal("charged_back"), "CHARGED_BACK");
  });

  it("action_required / processing / created", () => {
    assert.equal(mapMpOrderStatusToInternal("action_required"), "ACTION_REQUIRED");
    assert.equal(mapMpOrderStatusToInternal("processing"), "PROCESSING");
    assert.equal(mapMpOrderStatusToInternal("created"), "CREATED");
  });
});

describe("mercado-pago webhook signature", () => {
  const secret = "whsec_test_secret_value_123";

  it("rejeita sem secret", () => {
    const r = verifyMercadoPagoWebhookSignature({
      xSignature: "ts=1,v1=abc",
      xRequestId: "req-1",
      dataId: "123",
      secret: "",
    });
    assert.equal(r.valid, false);
    assert.equal(r.reason, "WEBHOOK_SECRET_MISSING");
  });

  it("aceita assinatura válida e rejeita inválida / replay skew", () => {
    const dataId = "123456";
    const requestId = "abc-req";
    const ts = String(Date.now());
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

    const ok = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataId,
      secret,
    });
    assert.equal(ok.valid, true);

    const bad = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=deadbeef`,
      xRequestId: requestId,
      dataId,
      secret,
    });
    assert.equal(bad.valid, false);
    assert.equal(bad.reason, "SIGNATURE_MISMATCH");

    const oldTs = String(Date.now() - 10 * 60 * 1000);
    const oldManifest = `id:${dataId};request-id:${requestId};ts:${oldTs};`;
    const oldV1 = createHmac("sha256", secret).update(oldManifest).digest("hex");
    const skew = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${oldTs},v1=${oldV1}`,
      xRequestId: requestId,
      dataId,
      secret,
    });
    assert.equal(skew.valid, false);
    assert.equal(skew.reason, "TIMESTAMP_SKEW");
  });
});

describe("mercado-pago client helpers", () => {
  it("hashPayload é estável", () => {
    assert.equal(hashPayload('{"a":1}'), hashPayload('{"a":1}'));
    assert.notEqual(hashPayload('{"a":1}'), hashPayload('{"a":2}'));
  });
});

describe("mercado-pago secret leak patterns", () => {
  it("componentes client não importam config/client server-only", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const clients = [
      path.resolve(process.cwd(), "src/components/features/marketplace/mercado-pago-checkout.tsx"),
      path.resolve(process.cwd(), "src/components/features/marketplace/checkout-panel.tsx"),
      path.resolve(process.cwd(), "src/components/features/marketplace/checkout-pay-again.tsx"),
    ];
    for (const file of clients) {
      const content = await fs.readFile(file, "utf8");
      assert.ok(!content.includes("@/lib/mercado-pago/config"));
      assert.ok(!content.includes("@/lib/mercado-pago/client"));
      assert.ok(!content.includes("MERCADO_PAGO_ACCESS_TOKEN"));
      assert.ok(!/APP_USR-[A-Za-z0-9_-]{16,}/.test(content));
    }
  });
});
