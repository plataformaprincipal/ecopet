import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { sanitizeSearchTerm, sanitizeDataLayerParams, assertSafeEventName } from "./event-sanitizer";
import { validateTelemetryPayload } from "./event-validator";
import { shouldDedupeEvent, claimTransactionalOnce, buildDedupeKey } from "./deduplication";
import { buildEcommerceParams } from "./ecommerce";
import { getInstrumentationCoverage, INSTRUMENTED_SURFACES } from "./coverage";
import { GTM_EVENT_VERSION } from "./contract";
import { pushTelemetryEvent } from "./pipeline";
import { GtmEvents } from "./events";

function mockWindow(opts?: { consentGranted?: boolean }) {
  const dataLayer: unknown[] = [];
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  const win = {
    dataLayer,
    localStorage: ls,
    sessionStorage: ls,
    gtag: undefined as undefined,
  };
  Object.assign(globalThis, { window: win, localStorage: ls, sessionStorage: ls });
  if (opts?.consentGranted) {
    store.set(
      "ecopet.analytics.consent.v1",
      JSON.stringify({
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      })
    );
    store.set("ecopet.analytics.consent.choice.v1", "1");
  }
  process.env.NEXT_PUBLIC_GTM_ID = "GTM-PIPETEST1";
  process.env.VERCEL_ENV = "production";
  return dataLayer;
}

describe("gtm sanitizer / validator", () => {
  it("bloqueia search sensível", () => {
    assert.equal(sanitizeSearchTerm("user@mail.com"), undefined);
    assert.equal(sanitizeSearchTerm("ração premium"), "ração premium");
  });

  it("remove PII de params", () => {
    const out = sanitizeDataLayerParams({
      email: "a@b.com",
      token: "x",
      module: "auth",
      ok: true,
    });
    assert.equal(out.module, "auth");
    assert.equal(out.ok, true);
    assert.equal(out.email, undefined);
  });

  it("valida nomes", () => {
    assert.equal(assertSafeEventName("login"), true);
    assert.equal(assertSafeEventName("ecopet_ga_event"), true);
    assert.equal(validateTelemetryPayload({ event: "bad name" }).ok, false);
    assert.equal(
      validateTelemetryPayload({ event: "ecopet_ga_event", event_version: GTM_EVENT_VERSION }).ok,
      true
    );
  });
});

describe("gtm dedupe", () => {
  it("bloqueia double-fire curto", () => {
    const key = buildDedupeKey("login", ["u1"]);
    assert.equal(shouldDedupeEvent(key, 5_000), false);
    assert.equal(shouldDedupeEvent(key, 5_000), true);
  });

  it("claimTransactionalOnce", () => {
    mockWindow();
    assert.equal(claimTransactionalOnce("purchase", "ord-1"), true);
    assert.equal(claimTransactionalOnce("purchase", "ord-1"), false);
  });
});

describe("gtm ecommerce", () => {
  it("monta params BRL sem objetos aninhados", () => {
    const p = buildEcommerceParams("add_to_cart", {
      currency: "BRL",
      value: 10,
      items: [{ item_id: "sku1", price: 10, quantity: 1 }],
    });
    assert.equal(p.currency, "BRL");
    assert.equal(p.items_count, 1);
    assert.ok(String(p.item_ids).includes("sku1"));
  });
});

describe("gtm coverage", () => {
  it("lista superfícies reais", () => {
    assert.ok(INSTRUMENTED_SURFACES.length >= 10);
    const c = getInstrumentationCoverage(["login", "purchase", "never_wired_xyz"]);
    assert.ok(c.implementedCount >= 10);
    assert.ok(c.notInstrumentedSample.includes("never_wired_xyz"));
  });
});

describe("gtm pipeline", () => {
  beforeEach(() => {
    mockWindow({ consentGranted: true });
  });

  it("respeita consentimento negado", () => {
    mockWindow({ consentGranted: false });
    const r = pushTelemetryEvent({ event: GtmEvents.GA_MIRROR, ga_event: "login" });
    assert.equal(r.pushed, false);
    assert.equal(r.reason, "no_consent");
  });

  it("empurra espelho com consent", () => {
    const layer = mockWindow({ consentGranted: true });
    const r = pushTelemetryEvent({
      event: GtmEvents.GA_MIRROR,
      ga_event: "login",
      module: "auth",
      source: "gtag_mirror",
    });
    assert.equal(r.pushed, true);
    const last = layer[layer.length - 1] as { event?: string; ga_event?: string };
    assert.equal(last.event, "ecopet_ga_event");
    assert.equal(last.ga_event, "login");
  });

  it("não quebra SSR", () => {
    Reflect.deleteProperty(globalThis, "window");
    const r = pushTelemetryEvent({ event: "login" });
    assert.equal(r.reason, "ssr");
  });
});
