import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  getGtmContainerId,
  getGtmSanitizedStatus,
  isValidGtmContainerId,
  maskGtmContainerId,
  shouldLoadGtm,
} from "./config";
import { ensureDataLayer, pushEvent, pushPage, pushToDataLayer } from "./datalayer";
import { GtmEvents } from "./events";
import { getGtmHealth } from "./health";

function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { ...process.env, ...overrides } as NodeJS.ProcessEnv;
}

function mockWindow() {
  const dataLayer: unknown[] = [];
  // @ts-expect-error test stub
  globalThis.window = {
    dataLayer,
    __ecopetGtmReady: false,
  };
  return dataLayer;
}

describe("gtm config", () => {
  it("valida e mascara Container ID", () => {
    assert.equal(isValidGtmContainerId("GTM-ABC123"), true);
    assert.equal(isValidGtmContainerId("GTM-XXXX"), false);
    assert.equal(isValidGtmContainerId("G-ABC"), false);
    const masked = maskGtmContainerId("GTM-ABC123XYZ");
    assert.ok(masked);
    assert.ok(!masked!.includes("ABC123"));
    assert.ok(masked!.startsWith("GTM-"));
  });

  it("ausente / inválido", () => {
    const missing = env({ NEXT_PUBLIC_GTM_ID: undefined });
    delete missing.NEXT_PUBLIC_GTM_ID;
    assert.equal(getGtmContainerId(missing), null);
    assert.equal(getGtmSanitizedStatus(missing).status, "MISSING");

    const invalid = env({ NEXT_PUBLIC_GTM_ID: "GTM-XXXX" });
    assert.equal(getGtmSanitizedStatus(invalid).status, "INVALID_ID");
  });

  it("produção carrega; development não (default)", () => {
    const prod = env({
      NEXT_PUBLIC_GTM_ID: "GTM-PRODTEST1",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
      NEXT_PUBLIC_GTM_ENABLED: undefined,
    });
    delete prod.NEXT_PUBLIC_GTM_ENABLED;
    assert.equal(shouldLoadGtm(prod), true);
    assert.equal(getGtmSanitizedStatus(prod).status, "READY");

    const dev = env({
      NEXT_PUBLIC_GTM_ID: "GTM-PRODTEST1",
      VERCEL_ENV: undefined,
      NODE_ENV: "development",
      NEXT_PUBLIC_GTM_ENABLE_DEV: undefined,
    });
    delete dev.VERCEL_ENV;
    delete dev.NEXT_PUBLIC_GTM_ENABLE_DEV;
    assert.equal(shouldLoadGtm(dev), false);
    assert.equal(getGtmSanitizedStatus(dev).status, "DEV_ONLY");
  });

  it("nunca vaza ID completo no status", () => {
    const e = env({
      NEXT_PUBLIC_GTM_ID: "GTM-SECRET99",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
    });
    const status = getGtmSanitizedStatus(e);
    assert.ok(!JSON.stringify(status).includes("SECRET99"));
    assert.ok(status.containerIdMasked);
  });
});

describe("gtm dataLayer", () => {
  beforeEach(() => {
    mockWindow();
  });

  it("ensure + pushEvent namespaced", () => {
    const layer = ensureDataLayer();
    assert.ok(Array.isArray(layer));
    pushEvent(GtmEvents.GA_MIRROR, { ga_event: "login", module: "auth" });
    const last = layer[layer.length - 1] as { event?: string; ga_event?: string; email?: string };
    assert.equal(last.event, "ecopet_ga_event");
    assert.equal(last.ga_event, "login");
  });

  it("sanitize remove PII do dataLayer", () => {
    const layer = ensureDataLayer();
    pushToDataLayer({
      event: "ecopet_test",
      email: "user@example.com",
      token: "abc",
      ok: true,
    });
    const last = layer[layer.length - 1] as Record<string, unknown>;
    assert.equal(last.event, "ecopet_test");
    assert.equal(last.ok, true);
    assert.equal(last.email, undefined);
    assert.equal(last.token, undefined);
  });

  it("pushPage usa ecopet_page_view (não page_view)", () => {
    const layer = ensureDataLayer();
    pushPage({ path: "/marketplace", title: "Shop" });
    const last = layer[layer.length - 1] as { event?: string; page_path?: string };
    assert.equal(last.event, "ecopet_page_view");
    assert.equal(last.page_path, "/marketplace");
    assert.notEqual(last.event, "page_view");
  });
});

describe("gtm health", () => {
  it("reporta versão e formato", () => {
    const prev = process.env.NEXT_PUBLIC_GTM_ID;
    process.env.NEXT_PUBLIC_GTM_ID = "GTM-HEALTH01";
    process.env.VERCEL_ENV = "production";
    try {
      const h = getGtmHealth();
      assert.equal(h.alive, true);
      assert.equal(h.idFormatOk, true);
      assert.ok(h.version.includes("gtm"));
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_GTM_ID;
      else process.env.NEXT_PUBLIC_GTM_ID = prev;
    }
  });
});
