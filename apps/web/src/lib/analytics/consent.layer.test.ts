import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  CONSENT_CHOICE_KEY,
  CONSENT_STORAGE_KEY,
  acceptAllConsent,
  acceptNecessaryOnly,
  hasConsentChoice,
  getStoredConsent,
} from "./consent";

function mockLocalStorage() {
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
  };
  // @ts-expect-error test stub
  globalThis.window = { localStorage: ls, dataLayer: [], gtag: undefined };
  // @ts-expect-error test stub
  globalThis.localStorage = ls;
}

describe("consent mode v2 banner helpers", () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.clear();
  });

  it("sem escolha → hasConsentChoice false", () => {
    assert.equal(hasConsentChoice(), false);
  });

  it("acceptNecessaryOnly persiste denied e marca escolha", () => {
    const c = acceptNecessaryOnly();
    assert.equal(c.analytics_storage, "denied");
    assert.equal(hasConsentChoice(), true);
    assert.equal(localStorage.getItem(CONSENT_CHOICE_KEY), "1");
    assert.ok(localStorage.getItem(CONSENT_STORAGE_KEY));
  });

  it("acceptAllConsent concede analytics e ads", () => {
    const c = acceptAllConsent();
    assert.equal(c.analytics_storage, "granted");
    assert.equal(c.ad_storage, "granted");
    assert.deepEqual(getStoredConsent()?.ad_personalization, "granted");
  });
});
