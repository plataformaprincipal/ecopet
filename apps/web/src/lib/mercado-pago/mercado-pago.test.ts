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
    process.env.PAYMENT_PROVIDER = "mercado_pago";
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

    // Docs MP: ts em segundos Unix — deve passar no skew e no HMAC
    const tsSec = String(Math.floor(Date.now() / 1000));
    const secManifest = `id:${dataId};request-id:${requestId};ts:${tsSec};`;
    const secV1 = createHmac("sha256", secret).update(secManifest).digest("hex");
    const okSec = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${tsSec},v1=${secV1}`,
      xRequestId: requestId,
      dataId,
      secret,
    });
    assert.equal(okSec.valid, true, "ts em segundos Unix (formato oficial MP)");

    // Orders API: data.id alfanumérico uppercase — MP assina com case original
    const ordId = "ORDTST01EXAMPLEUPPERCASEID0001";
    const ordTs = String(Math.floor(Date.now() / 1000));
    const ordManifest = `id:${ordId};request-id:${requestId};ts:${ordTs};`;
    const ordV1 = createHmac("sha256", secret).update(ordManifest).digest("hex");
    const okOrd = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ordTs},v1=${ordV1}`,
      xRequestId: requestId,
      dataId: ordId,
      secret,
    });
    assert.equal(okOrd.valid, true, "data.id uppercase preservado no manifest");

    // SDK: omitir id do manifest quando data.id ausente na notificação
    const omitTs = String(Math.floor(Date.now() / 1000));
    const omitManifest = `request-id:${requestId};ts:${omitTs};`;
    const omitV1 = createHmac("sha256", secret).update(omitManifest).digest("hex");
    const okOmit = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${omitTs},v1=${omitV1}`,
      xRequestId: requestId,
      dataId: null,
      secret,
    });
    assert.equal(okOmit.valid, true, "manifest sem id quando data.id ausente");
  });

  it("vetores determinísticos: ts/request-id/data.id/secret errados", () => {
    const dataId = "ORDTST01VECTORCASE0001";
    const requestId = "req-vector-001";
    const ts = "1700000000";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
    const nowMs = Number(ts) * 1000;

    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: requestId,
        dataId,
        secret,
        nowMs,
      }).valid,
      true
    );

    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${Number(ts) + 1},v1=${v1}`,
        xRequestId: requestId,
        dataId,
        secret,
        nowMs: (Number(ts) + 1) * 1000,
      }).reason,
      "SIGNATURE_MISMATCH"
    );

    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: "other-req",
        dataId,
        secret,
        nowMs,
      }).reason,
      "SIGNATURE_MISMATCH"
    );

    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: requestId,
        dataId: "ORDTST01VECTORCASE0002",
        secret,
        nowMs,
      }).reason,
      "SIGNATURE_MISMATCH"
    );

    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: requestId,
        dataId,
        secret: "wrong_secret_value_xxx",
        nowMs,
      }).reason,
      "SIGNATURE_MISMATCH"
    );

    // Docs Orders legadas: assinatura gerada com lowercase; dataId uppercase ainda aceita via DOCS_LOWERCASE
    const lowerManifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
    const lowerV1 = createHmac("sha256", secret).update(lowerManifest).digest("hex");
    const lowerOk = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${lowerV1}`,
      xRequestId: requestId,
      dataId,
      secret,
      nowMs,
    });
    assert.equal(lowerOk.valid, true, "candidato DOCS_LOWERCASE");
    assert.equal(lowerOk.diagnostics?.candidateUsed, "DOCS_LOWERCASE");
  });

  it("data.id na query / Order alfanumérico / body diferente / query ausente", async () => {
    const { extractMercadoPagoWebhookQuery } = await import("./webhook-query");
    const secret = "whsec_test_secret_value_123";
    const ordId = "ORDTST01REALORDERID0001ABCD";
    const requestId = "req-order-query-1";
    const ts = "1700000000";
    const nowMs = Number(ts) * 1000;

    const q = extractMercadoPagoWebhookQuery(
      `https://homolog.eccopet.com/api/webhooks/mercado-pago?data.id=${ordId}&type=order`
    );
    assert.deepEqual(q.rawQueryKeys.sort(), ["data.id", "type"].sort());
    assert.equal(q.queryDataDotId, ordId);
    assert.equal(q.preferredQueryDataId, ordId);

    const manifest = `id:${ordId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
    const ok = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataId: q.preferredQueryDataId,
      dataIdSource: "QUERY_DATA_DOT_ID",
      secret,
      nowMs,
    });
    assert.equal(ok.valid, true);
    assert.equal(ok.diagnostics?.dataIdSource, "QUERY_DATA_DOT_ID");
    assert.equal(ok.diagnostics?.candidateUsed, "SDK_ORIGINAL");

    // body data.id diferente da query — HMAC deve usar a query (valor passado)
    const bodyDifferent = "ORDTST01DIFFERENTBODY0000001";
    assert.notEqual(ordId, bodyDifferent);
    const withQuery = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataId: ordId,
      secret,
      nowMs,
    });
    assert.equal(withQuery.valid, true);
    const withBody = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataId: bodyDifferent,
      secret,
      nowMs,
    });
    assert.equal(withBody.valid, false);
    assert.equal(withBody.reason, "SIGNATURE_MISMATCH");

    // query ausente → manifest sem id (SDK omite)
    const omitManifest = `request-id:${requestId};ts:${ts};`;
    const omitV1 = createHmac("sha256", secret).update(omitManifest).digest("hex");
    const omitOk = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${omitV1}`,
      xRequestId: requestId,
      dataId: null,
      secret,
      nowMs,
    });
    assert.equal(omitOk.valid, true);

    // x-request-id ausente
    const noReqManifest = `id:${ordId};ts:${ts};`;
    const noReqV1 = createHmac("sha256", secret).update(noReqManifest).digest("hex");
    const noReqOk = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${noReqV1}`,
      xRequestId: null,
      dataId: ordId,
      secret,
      nowMs,
    });
    assert.equal(noReqOk.valid, true);

    // 1 caractere a menos no data.id → inválida
    const oneChar = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataId: ordId.slice(0, -1) + "X",
      secret,
      nowMs,
    });
    assert.equal(oneChar.valid, false);
    assert.equal(oneChar.reason, "SIGNATURE_MISMATCH");
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
