import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  buildCheckoutTestNotes,
  getMercadoPagoTestCheckoutBlock,
  getMercadoPagoTestPublicConfig,
  getMercadoPagoTestServerConfig,
  isCheckoutTestOrderNotes,
  isMercadoPagoTestCheckoutConfigured,
  MP_TEST_MATCHES_LIVE_MESSAGE,
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
    const block = getMercadoPagoTestCheckoutBlock();
    assert.equal(block?.code, "MP_TEST_NOT_CONFIGURED");
  });

  it("aceita credenciais TEST com prefixo APP_USR quando diferentes das LIVE", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-live-secret-token-value";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "APP_USR-live-public-key-value";
    process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN = "APP_USR-test-access-token-value";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY = "APP_USR-test-public-key-value";
    assert.equal(isMercadoPagoTestCheckoutConfigured(), true);
    const server = getMercadoPagoTestServerConfig();
    assert.ok(server);
    assert.equal(server!.accessToken, "APP_USR-test-access-token-value");
    assert.equal(server!.environment, "test");
    const pub = getMercadoPagoTestPublicConfig();
    assert.equal(pub.configured, true);
    assert.equal(pub.publicKey, "APP_USR-test-public-key-value");
    const dumped = JSON.stringify(pub);
    assert.ok(!dumped.includes("APP_USR-live-secret"));
    assert.ok(!dumped.includes("accessToken"));
    assert.equal(getMercadoPagoTestCheckoutBlock(), null);
  });

  it("aceita par TEST isolado mesmo com prefixo TEST-", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-live-secret-token-value";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "APP_USR-live-public-key-value";
    process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN = "TEST-abc123validtokenvalue";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY = "TEST-pk-valid-key-value";
    assert.equal(isMercadoPagoTestCheckoutConfigured(), true);
  });

  it("bloqueia quando credenciais TEST coincidem com LIVE", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-same-secret-token-value";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "APP_USR-same-public-key-value";
    process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN = "APP_USR-same-secret-token-value";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY = "APP_USR-same-public-key-value";
    assert.equal(isMercadoPagoTestCheckoutConfigured(), false);
    assert.equal(getMercadoPagoTestServerConfig(), null);
    const block = getMercadoPagoTestCheckoutBlock();
    assert.equal(block?.code, "MP_TEST_MATCHES_LIVE");
    assert.equal(block?.message, MP_TEST_MATCHES_LIVE_MESSAGE);
    assert.equal(block?.message, "Credenciais TEST coincidem com LIVE.");
    const pub = getMercadoPagoTestPublicConfig();
    assert.equal(pub.configured, false);
    assert.equal(pub.publicKey, "");
  });

  it("bloqueia whitespace como ausente", () => {
    process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN = "   ";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY = "   ";
    assert.equal(isMercadoPagoTestCheckoutConfigured(), false);
  });

  it("marca notes de pedido TEST", () => {
    const notes = buildCheckoutTestNotes("porta dos fundos");
    assert.equal(isCheckoutTestOrderNotes(notes), true);
    assert.ok(notes.includes("AMBIENTE DE TESTE — NENHUMA COBRANÇA REAL"));
    assert.equal(isCheckoutTestOrderNotes("pedido normal"), false);
  });
});
