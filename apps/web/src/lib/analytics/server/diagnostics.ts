import "server-only";

import {
  detectAnalyticsEnvironment,
  getAnalyticsSanitizedStatus,
  getGaMeasurementId,
  maskMeasurementId,
  shouldSendToGoogle,
} from "../config";
import { getGaDataApiConfig } from "@/lib/admin/bi/ga-data-client";
import { countCatalogEvents, listAllEventDefinitions } from "../events/catalog";
import { analyticsCacheStats } from "./cache";
import { withAnalyticsCache } from "./cache";
import { getAnalyticsHealth } from "./health";
import { getAnalyticsQueueStats } from "./queue";
import { getOrCreateOpsState, updateOpsState } from "./repository";
import { analyticsServerLog } from "./logger";
import {
  ANALYTICS_MODULE_VERSION,
  type AnalyticsDiagnosticsReport,
} from "./types";

export async function runAnalyticsDiagnostics(options?: {
  persist?: boolean;
  skipCache?: boolean;
}): Promise<AnalyticsDiagnosticsReport> {
  const ttlSec = (await getOrCreateOpsState()).configFlags.cacheTtlSec ?? 45;
  const ttlMs = ttlSec * 1000;
  const loader = async () => buildDiagnostics(Boolean(options?.persist));

  if (options?.skipCache) return loader();
  return withAnalyticsCache("diagnostics:full", ttlMs, loader);
}

async function buildDiagnostics(persist: boolean): Promise<AnalyticsDiagnosticsReport> {
  const started = Date.now();
  const tracking = getAnalyticsSanitizedStatus();
  const id = getGaMeasurementId();
  const dataApi = getGaDataApiConfig();
  const [health, ops, queue] = await Promise.all([
    getAnalyticsHealth(persist),
    getOrCreateOpsState(),
    getAnalyticsQueueStats(),
  ]);
  const ttlSec = ops.configFlags.cacheTtlSec ?? 45;
  const cache = analyticsCacheStats();
  const responseMs = Date.now() - started;

  const report: AnalyticsDiagnosticsReport = {
    provider: "google-analytics-4",
    version: ANALYTICS_MODULE_VERSION,
    status: tracking,
    measurementIdConfigured: Boolean(id),
    measurementIdMasked: maskMeasurementId(id),
    propertyIdMasked: dataApi.propertyIdMasked,
    dataApiStatus: dataApi.configured ? "CONFIGURED" : "NOT_CONFIGURED",
    sendToGoogle: shouldSendToGoogle(),
    consentMode: "v2",
    catalogEventCount: countCatalogEvents(),
    scriptHosts: [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ],
    notes: [
      "Measurement ID / Property ID / service account nunca retornados completos.",
      "EcoPet não duplica o data warehouse do Google Analytics.",
      "Fila usa JobQueue interno (ANALYTICS_HEALTH_CHECK).",
      "Cache em memória do processo (TTL configurável).",
    ],
    health,
    cache: { ...cache, ttlSec },
    queue: {
      pending: queue.pending,
      failed: queue.failed,
      supported: queue.supported,
    },
    ops: {
      lastSyncAt: ops.lastSyncAt?.toISOString() ?? null,
      lastErrorCode: ops.lastErrorCode,
      configFlags: {
        debugLogging: Boolean(ops.configFlags.debugLogging),
        cacheTtlSec: ops.configFlags.cacheTtlSec ?? 45,
        healthJobsEnabled: Boolean(ops.configFlags.healthJobsEnabled),
      },
    },
    responseMs,
  };

  if (persist) {
    const { measurementIdMasked: _m, ...safeDiag } = report;
    void _m;
    await updateOpsState({
      status: health.status,
      environment: detectAnalyticsEnvironment(),
      lastDiagnostics: safeDiag as unknown as Record<string, unknown>,
      lastSyncAt: new Date(),
      lastHealthAt: new Date(),
      avgResponseMs: responseMs,
      catalogEventCount: report.catalogEventCount,
      lastSuccessAt: new Date(),
    });
    analyticsServerLog("INFO", "diagnostics persisted", { responseMs, status: health.status });
  }

  return report;
}

export function getAnalyticsEventsCatalogSummary() {
  const defs = listAllEventDefinitions();
  const byModule = new Map<string, number>();
  for (const d of defs) {
    byModule.set(d.module, (byModule.get(d.module) ?? 0) + 1);
  }
  return {
    total: defs.length,
    modules: [...byModule.entries()]
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => a.module.localeCompare(b.module)),
    sample: defs.slice(0, 15).map((d) => ({
      event_name: d.event_name,
      category: d.category,
      module: d.module,
    })),
  };
}
