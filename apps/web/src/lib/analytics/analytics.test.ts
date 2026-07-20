import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectAnalyticsEnvironment,
  getAnalyticsSanitizedStatus,
  getDefaultConsentSettings,
  getGaMeasurementId,
  isAnalyticsExcludedPath,
  isValidGaMeasurementId,
  maskMeasurementId,
  shouldSendToGoogle,
} from "./config";
import { isSafeEventName, sanitizeEventParams, sanitizePath } from "./sanitize";
import { AnalyticsEvents } from "./events";
import { CONSENT_STORAGE_KEY } from "./consent";
import { getGoogleAnalyticsAdminDiagnostics } from "./server-compat";

function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { ...process.env, ...overrides } as NodeJS.ProcessEnv;
}

describe("analytics config", () => {
  it("Measurement ID ausente", () => {
    const e = env({ NEXT_PUBLIC_GA_MEASUREMENT_ID: undefined });
    delete e.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    assert.equal(getGaMeasurementId(e), null);
    assert.equal(shouldSendToGoogle(e), false);
    assert.equal(getAnalyticsSanitizedStatus(e).status, "MISSING");
  });

  it("placeholder não conta como configurado", () => {
    const e = env({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-XXXXXXXX" });
    assert.equal(getGaMeasurementId(e), null);
    assert.equal(getAnalyticsSanitizedStatus(e).status, "INVALID_ID");
  });

  it("ID válido é aceito e mascarado", () => {
    const e = env({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC123XYZ" });
    assert.equal(getGaMeasurementId(e), "G-ABC123XYZ");
    assert.equal(isValidGaMeasurementId("G-ABC123XYZ"), true);
    const masked = maskMeasurementId("G-ABC123XYZ");
    assert.ok(masked);
    assert.ok(!masked!.includes("ABC123"));
    assert.ok(masked!.startsWith("G-A"));
  });

  it("produção envia; development não (default)", () => {
    const prod = env({
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-PRODTEST01",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
      NEXT_PUBLIC_GA_ENABLED: undefined,
    });
    delete prod.NEXT_PUBLIC_GA_ENABLED;
    assert.equal(detectAnalyticsEnvironment(prod), "production");
    assert.equal(shouldSendToGoogle(prod), true);
    assert.equal(getAnalyticsSanitizedStatus(prod).status, "READY");

    const dev = env({
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-PRODTEST01",
      VERCEL_ENV: undefined,
      NODE_ENV: "development",
      NEXT_PUBLIC_GA_ENABLE_DEV: undefined,
    });
    delete dev.VERCEL_ENV;
    delete dev.NEXT_PUBLIC_GA_ENABLE_DEV;
    assert.equal(detectAnalyticsEnvironment(dev), "development");
    assert.equal(shouldSendToGoogle(dev), false);
    assert.equal(getAnalyticsSanitizedStatus(dev).status, "DEV_ONLY");
  });

  it("NEXT_PUBLIC_GA_ENABLE_DEV=1 libera development", () => {
    const e = env({
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-DEVTEST001",
      NODE_ENV: "development",
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_GA_ENABLE_DEV: "1",
    });
    delete e.VERCEL_ENV;
    assert.equal(shouldSendToGoogle(e), true);
  });

  it("kill-switch NEXT_PUBLIC_GA_ENABLED=false", () => {
    const e = env({
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-KILLTEST01",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
      NEXT_PUBLIC_GA_ENABLED: "false",
    });
    assert.equal(shouldSendToGoogle(e), false);
  });

  it("paths admin/api/auth excluídos", () => {
    assert.equal(isAnalyticsExcludedPath("/admin"), true);
    assert.equal(isAnalyticsExcludedPath("/admin/integracoes"), true);
    assert.equal(isAnalyticsExcludedPath("/api/health"), true);
    assert.equal(isAnalyticsExcludedPath("/login"), true);
    assert.equal(isAnalyticsExcludedPath("/marketplace"), false);
    assert.equal(isAnalyticsExcludedPath("/"), false);
  });

  it("consent default denied (LGPD)", () => {
    const e = env({ NEXT_PUBLIC_GA_CONSENT_DEFAULT: undefined });
    delete e.NEXT_PUBLIC_GA_CONSENT_DEFAULT;
    const c = getDefaultConsentSettings(e);
    assert.equal(c.analytics_storage, "denied");
    assert.equal(c.ad_storage, "denied");
  });

  it("consent default granted via env", () => {
    const e = env({ NEXT_PUBLIC_GA_CONSENT_DEFAULT: "granted" });
    const c = getDefaultConsentSettings(e);
    assert.equal(c.analytics_storage, "granted");
    assert.equal(c.ad_storage, "denied");
  });
});

describe("analytics sanitize", () => {
  it("bloqueia nomes inseguros", () => {
    assert.equal(isSafeEventName("login"), true);
    assert.equal(isSafeEventName("password_submit"), false);
    assert.equal(isSafeEventName(""), false);
    assert.equal(isSafeEventName("BAD NAME"), false);
  });

  it("remove PII e secrets dos params", () => {
    const out = sanitizeEventParams({
      item_id: "sku-1",
      email: "user@example.com",
      password: "secret",
      token: "abc",
      cpf: "123",
      rg: "456",
      telefone: "11999999999",
      note: "ok",
    });
    assert.equal(out.item_id, "sku-1");
    assert.equal(out.note, "ok");
    assert.equal(out.email, undefined);
    assert.equal(out.password, undefined);
    assert.equal(out.token, undefined);
    assert.equal(out.cpf, undefined);
    assert.equal(out.rg, undefined);
    assert.equal(out.telefone, undefined);
  });

  it("sanitizePath remove query sensível", () => {
    const path = sanitizePath("/checkout?token=abc&utm_source=x");
    assert.ok(!path.includes("token="));
    assert.ok(path.includes("utm_source=x"));
  });
});

describe("analytics events catalog", () => {
  it("exporta eventos estáveis", () => {
    assert.equal(AnalyticsEvents.PURCHASE, "purchase");
    assert.equal(AnalyticsEvents.LOGIN, "login");
  });
});

describe("analytics consent storage key", () => {
  it("chave estável para LGPD banner futuro", () => {
    assert.equal(CONSENT_STORAGE_KEY, "ecopet.analytics.consent.v1");
  });
});

describe("analytics admin diagnostics", () => {
  it("nunca retorna Measurement ID completo", () => {
    const prev = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const prevVercel = process.env.VERCEL_ENV;
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-SECRETID99";
    process.env.VERCEL_ENV = "production";
    try {
      const diag = getGoogleAnalyticsAdminDiagnostics();
      const dumped = JSON.stringify(diag);
      assert.ok(!dumped.includes("G-SECRETID99"));
      assert.ok(diag.measurementIdMasked);
      assert.equal(diag.provider, "google-analytics-4");
      assert.equal(diag.consentMode, "v2");
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = prev;
      if (prevVercel === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = prevVercel;
    }
  });
});
