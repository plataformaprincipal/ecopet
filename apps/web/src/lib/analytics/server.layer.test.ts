import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyticsCacheGet,
  analyticsCacheSet,
  clearAnalyticsCache,
  analyticsCacheStats,
  withAnalyticsCache,
} from "./server/cache";
import { validateConfigFlags, validateDebugEventName } from "./server/validator";
import { ANALYTICS_MODULE_VERSION, ANALYTICS_PROVIDER } from "./server/types";
import { assertNoSecretsInJson, sanitizeAnalyticsPayload } from "./server/security";
import { getGoogleAnalyticsAdminDiagnostics } from "./server-compat";

describe("analytics server cache", () => {
  it("set/get e clear", async () => {
    clearAnalyticsCache();
    analyticsCacheSet("k1", { a: 1 }, 60_000);
    assert.deepEqual(analyticsCacheGet("k1"), { a: 1 });
    const stats = analyticsCacheStats();
    assert.ok(stats.size >= 1);
    clearAnalyticsCache("k");
    assert.equal(analyticsCacheGet("k1"), undefined);
  });

  it("withAnalyticsCache reutiliza valor", async () => {
    clearAnalyticsCache();
    let loads = 0;
    const v1 = await withAnalyticsCache("probe", 60_000, async () => {
      loads += 1;
      return "ok";
    });
    const v2 = await withAnalyticsCache("probe", 60_000, async () => {
      loads += 1;
      return "ok2";
    });
    assert.equal(v1, "ok");
    assert.equal(v2, "ok");
    assert.equal(loads, 1);
  });
});

describe("analytics server validator", () => {
  it("valida flags", () => {
    assert.equal(validateConfigFlags(null).ok, false);
    assert.equal(validateConfigFlags({}).ok, false);
    const ok = validateConfigFlags({ debugLogging: true, cacheTtlSec: 60 });
    assert.equal(ok.ok, true);
    assert.equal(ok.flags?.debugLogging, true);
    assert.equal(ok.flags?.cacheTtlSec, 60);
    assert.equal(validateConfigFlags({ cacheTtlSec: 1 }).ok, false);
  });

  it("valida debug event name", () => {
    assert.equal(validateDebugEventName("login"), true);
    assert.equal(validateDebugEventName("bad name"), false);
    assert.equal(validateDebugEventName(""), false);
  });
});

describe("analytics server security", () => {
  it("sanitize remove chaves sensíveis", () => {
    const out = sanitizeAnalyticsPayload({
      ok: true,
      measurementId: "G-XXX",
      token: "abc",
      note: "safe",
    });
    assert.equal(out.ok, true);
    assert.equal(out.note, "safe");
    assert.equal(out.measurementId, undefined);
    assert.equal(out.token, undefined);
  });

  it("detecta private key em JSON", () => {
    assert.equal(assertNoSecretsInJson({ a: 1 }), true);
    assert.equal(
      assertNoSecretsInJson({ private_key: "BEGIN PRIVATE KEY" }),
      false
    );
  });
});

describe("analytics server types", () => {
  it("versão e provider estáveis", () => {
    assert.equal(ANALYTICS_PROVIDER, "google_analytics");
    assert.ok(ANALYTICS_MODULE_VERSION.length > 0);
  });
});

describe("analytics admin diagnostics (compat)", () => {
  it("não vaza Measurement ID", () => {
    const prev = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-LAYERTEST99";
    try {
      const diag = getGoogleAnalyticsAdminDiagnostics();
      assert.ok(!JSON.stringify(diag).includes("G-LAYERTEST99"));
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = prev;
    }
  });
});
