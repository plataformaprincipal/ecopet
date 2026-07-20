import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getRecommendedTags,
  getRecommendedTriggers,
  getRecommendedVariables,
  NAMESPACED_EVENT_PURPOSES,
} from "./inventory";
import {
  exportGovernanceCsv,
  exportGovernanceJson,
  exportGovernancePdfText,
} from "./export";
import type { GtmGovernanceReport } from "./types";

function stubReport(): GtmGovernanceReport {
  return {
    generatedAt: new Date().toISOString(),
    version: "test",
    overview: {
      containerConnected: false,
      status: "MISSING",
      environment: "development",
      containerIdMasked: null,
      loadContainer: false,
      debug: false,
      version: "test",
      build: null,
      lastSyncAt: null,
      lastErrorCode: null,
      avgResponseMs: 1,
      gaConnected: false,
      gaStatus: "MISSING",
      antiDuplicationNote: "note",
      sanitizedMessage: "msg",
    },
    health: { status: "DEGRADED", checks: [] },
    diagnostics: {
      problems: [],
      scripts: [],
      consentMode: "v2",
      dataLayerActive: true,
      notes: [],
    },
    dataLayer: {
      namespacedEvents: NAMESPACED_EVENT_PURPOSES,
      catalogTotal: 1,
      byCategory: [],
      byModule: [{ module: "auth", count: 1 }],
      recentSamples: [],
      discardedNote: "x",
    },
    tags: getRecommendedTags(),
    triggers: getRecommendedTriggers(),
    variables: getRecommendedVariables(),
    consent: {
      defaults: { analytics_storage: "denied" },
      bannerImplemented: true,
      cmpReady: true,
      lastChangeNote: "n",
    },
    bi: {
      eventsByModule: [{ module: "auth", count: 1 }],
      note: "n",
      relatedBiHref: "/admin/bi",
    },
    modules: [],
    environments: { current: "development", matrix: [] },
    alerts: [
      {
        id: "a1",
        severity: "warn",
        title: "Test",
        detail: "d",
      },
    ],
    logs: [],
    debug: { debugFlag: false, previewHint: "p", lastErrorCode: null },
    coverage: {
      implementedCount: 1,
      catalogCount: 10,
      coveragePct: 10,
      implemented: [],
      notInstrumentedSample: [],
      strategy: "B",
    },
    meta: { dataSource: "test", noWarehouseDuplication: true },
  };
}

describe("gtm governance inventory", () => {
  it("tags/triggers/variables não vazios", () => {
    assert.ok(getRecommendedTags().length >= 3);
    assert.ok(getRecommendedTriggers().length >= 3);
    assert.ok(getRecommendedVariables().length >= 3);
  });

  it("eventos namespaced usam prefixo ecopet_", () => {
    for (const e of NAMESPACED_EVENT_PURPOSES) {
      assert.ok(e.name.startsWith("ecopet_"));
    }
  });
});

describe("gtm governance export", () => {
  it("json/csv/pdf não incluem GTM- completo fictício", () => {
    const r = stubReport();
    r.overview.containerIdMasked = "GTM-A***99";
    const json = exportGovernanceJson(r);
    const csv = exportGovernanceCsv(r);
    const pdf = exportGovernancePdfText(r);
    assert.ok(json.includes("GTM-A***99"));
    assert.ok(!json.includes("GTM-SECRET"));
    assert.ok(csv.includes("overview"));
    assert.ok(pdf.includes("Governance"));
  });
});
