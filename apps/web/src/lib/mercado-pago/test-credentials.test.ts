import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  buildCheckoutTestNotes,
  getMercadoPagoTestPublicConfig,
  getMercadoPagoTestServerConfig,
  isCheckoutTestOrderNotes,
  isMercadoPagoTestCheckoutConfigured,
} from "./test-credentials";

describe("mercado-pago test credentials (isolated)", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("bloqueia quando TEST vars ausentes mesmo com LIVE configurado", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-live-secret-token-value";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "APP_USR-live-public-key-value";
    delete process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN;
    delete process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY;
    assert.equal(isMercadoPagoTestCheckoutConfigured(), false);
    assert.equal(getMercadoPagoTestServerConfig(), null);
    const pub = getMercadoPagoTestPublicConfig();
    assert.equal(pub.configured, false);
    assert.equal(pub.publicKey, "");
    assert.equal(pub.environment, "test");
  });

  it("não faz fallback de APP_USR nas vars TEST", () => {
    process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN = "APP_USR-should-not-be-used";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY = "APP_USR-should-not-be-used";
    assert.equal(isMercadoPagoTestCheckoutConfigured(), false);
  });

  it("aceita somente par TEST- isolado", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-live-secret-token-value";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "APP_USR-live-public-key-value";
    process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN = "TEST-abc123validtokenvalue";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY = "TEST-pk-valid-key-value";
    assert.equal(isMercadoPagoTestCheckoutConfigured(), true);
    const server = getMercadoPagoTestServerConfig();
    assert.ok(server);
    assert.equal(server!.accessToken, "TEST-abc123validtokenvalue");
    assert.equal(server!.environment, "test");
    const pub = getMercadoPagoTestPublicConfig();
    assert.equal(pub.configured, true);
    assert.equal(pub.publicKey, "TEST-pk-valid-key-value");
    const dumped = JSON.stringify(pub);
    assert.ok(!dumped.includes("APP_USR-live-secret"));
    assert.ok(!dumped.includes("accessToken"));
  });

  it("marca notes de pedido TEST", () => {
    const notes = buildCheckoutTestNotes("porta dos fundos");
    assert.equal(isCheckoutTestOrderNotes(notes), true);
    assert.ok(notes.includes("AMBIENTE DE TESTE — NENHUMA COBRANÇA REAL"));
    assert.equal(isCheckoutTestOrderNotes("pedido normal"), false);
  });
});
