import "server-only";

import { getAnalyticsSanitizedStatus, detectAnalyticsEnvironment } from "../config";
import { getGaDataApiConfig, fetchGaInboundReport } from "@/lib/admin/bi/ga-data-client";
import { resolveBiDateRange } from "@/lib/admin/bi/periods";
import { clearAnalyticsCache } from "./cache";
import { getAnalyticsServerConfig, patchAnalyticsServerConfig } from "./config-service";
import { runAnalyticsDiagnostics, getAnalyticsEventsCatalogSummary } from "./diagnostics";
import { dispatchServerDebugEvent } from "./dispatcher";
import {
  getAnalyticsHealth,
  getAnalyticsLiveness,
  getAnalyticsReadiness,
} from "./health";
import { getAnalyticsMetricsSnapshot, recordSystemMetric } from "./metrics";
import {
  enqueueAnalyticsJob,
  getAnalyticsQueueStats,
  reprocessFailedAnalyticsJobs,
} from "./queue";
import { listRecentOpsErrors, updateOpsState } from "./repository";
import type { AnalyticsConfigFlags, AnalyticsStatusReport } from "./types";
import { ANALYTICS_MODULE_VERSION } from "./types";
import { analyticsServerLog } from "./logger";

/** Facade enterprise — única entrada para controllers/APIs. */
export const AnalyticsServerService = {
  version: ANALYTICS_MODULE_VERSION,

  async status(): Promise<AnalyticsStatusReport> {
    const tracking = getAnalyticsSanitizedStatus();
    const dataApi = getGaDataApiConfig();
    const health = await getAnalyticsHealth(false);
    return {
      active: tracking.configured || dataApi.configured,
      provider: "google_analytics",
      environment: detectAnalyticsEnvironment(),
      trackingStatus: tracking.status,
      dataApiStatus: dataApi.configured ? "CONFIGURED" : "NOT_CONFIGURED",
      health: health.status,
      measurementIdMasked: tracking.measurementIdMasked,
      catalogEventCount: health.catalogEventCount,
      lastSyncAt: health.lastHealthAt,
      lastErrorCode: health.lastErrorCode,
    };
  },

  health: getAnalyticsHealth,
  readiness: getAnalyticsReadiness,
  liveness: getAnalyticsLiveness,
  diagnostics: runAnalyticsDiagnostics,
  config: getAnalyticsServerConfig,
  patchConfig: patchAnalyticsServerConfig,
  metrics: getAnalyticsMetricsSnapshot,
  eventsCatalog: getAnalyticsEventsCatalogSummary,
  queueStats: getAnalyticsQueueStats,
  recentErrors: listRecentOpsErrors,

  async realtime() {
    const range = resolveBiDateRange({ period: "today" });
    const report = await fetchGaInboundReport(range);
    return {
      status: report.status,
      realtimeActiveUsers: report.realtimeActiveUsers,
      sanitizedMessage: report.sanitizedMessage,
      measurementIdMasked: report.measurementIdMasked,
      propertyIdMasked: report.propertyIdMasked,
      metrics: report.metrics,
    };
  },

  async debug() {
    const [status, health, queue] = await Promise.all([
      this.status(),
      getAnalyticsHealth(false),
      getAnalyticsQueueStats(),
    ]);
    return {
      status,
      health,
      queue,
      env: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV ?? null,
        gaDebug: process.env.NEXT_PUBLIC_GA_DEBUG === "1",
      },
      version: ANALYTICS_MODULE_VERSION,
    };
  },

  async testProbe() {
    const started = Date.now();
    const diag = await runAnalyticsDiagnostics({ persist: true, skipCache: true });
    const ms = Date.now() - started;
    await recordSystemMetric("analytics.diagnostics.probe_ms", ms, {
      status: diag.health.status,
    });
    return {
      ok: diag.health.alive,
      responseMs: ms,
      health: diag.health.status,
      tracking: diag.status.status,
      dataApi: diag.dataApiStatus,
    };
  },

  debugEvent: dispatchServerDebugEvent,

  async reprocess(limit?: number) {
    const result = await reprocessFailedAnalyticsJobs(limit);
    analyticsServerLog("INFO", "analytics jobs reprocessed", result);
    return result;
  },

  async enqueueHealthJob() {
    return enqueueAnalyticsJob("ANALYTICS_HEALTH_CHECK");
  },

  async clearCache(prefix?: string) {
    return clearAnalyticsCache(prefix);
  },

  async updateFlags(flags: AnalyticsConfigFlags, userId: string) {
    return patchAnalyticsServerConfig(flags, userId);
  },

  async markError(code: string, message: string) {
    await updateOpsState({
      status: "ERROR",
      lastErrorAt: new Date(),
      lastErrorCode: code,
    });
    analyticsServerLog("ERROR", message, { code });
  },
};

export type AnalyticsServerServiceType = typeof AnalyticsServerService;
