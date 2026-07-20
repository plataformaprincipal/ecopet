import "server-only";

import {
  detectAnalyticsEnvironment,
  getAnalyticsSanitizedStatus,
  shouldSendToGoogle,
} from "../config";
import { getGaDataApiConfig } from "@/lib/admin/bi/ga-data-client";
import { countCatalogEvents } from "../events/catalog";
import { getOrCreateOpsState, updateOpsState } from "./repository";
import {
  ANALYTICS_MODULE_VERSION,
  type AnalyticsHealthReport,
  type AnalyticsOpsStatus,
} from "./types";

function resolveOpsStatus(
  trackingStatus: string,
  dataApiConfigured: boolean
): AnalyticsOpsStatus {
  if (trackingStatus === "READY" && dataApiConfigured) return "READY";
  if (trackingStatus === "READY" || dataApiConfigured) return "DEGRADED";
  if (trackingStatus === "MISSING" || trackingStatus === "INVALID_ID") return "NOT_CONFIGURED";
  if (trackingStatus === "DISABLED" || trackingStatus === "DEV_ONLY") return "DISABLED";
  return "UNKNOWN";
}

export async function getAnalyticsHealth(persist = false): Promise<AnalyticsHealthReport> {
  const started = Date.now();
  const tracking = getAnalyticsSanitizedStatus();
  const dataApi = getGaDataApiConfig();
  const ops = await getOrCreateOpsState();
  const catalogEventCount = ops.catalogEventCount ?? countCatalogEvents();
  const status = resolveOpsStatus(tracking.status, dataApi.configured);
  const responseMs = Date.now() - started;

  const report: AnalyticsHealthReport = {
    status,
    alive: true,
    ready: status === "READY" || status === "DEGRADED",
    trackingConfigured: tracking.configured,
    dataApiConfigured: dataApi.configured,
    sendToGoogle: shouldSendToGoogle(),
    catalogEventCount,
    lastHealthAt: new Date().toISOString(),
    lastSuccessAt: ops.lastSuccessAt?.toISOString() ?? null,
    lastErrorAt: ops.lastErrorAt?.toISOString() ?? null,
    lastErrorCode: ops.lastErrorCode,
    avgResponseMs: ops.avgResponseMs ?? responseMs,
    environment: detectAnalyticsEnvironment(),
    version: ANALYTICS_MODULE_VERSION,
    build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.NEXT_PUBLIC_BUILD_ID ?? null,
  };

  if (persist) {
    await updateOpsState({
      status,
      environment: report.environment,
      lastHealthAt: new Date(),
      avgResponseMs: responseMs,
      catalogEventCount,
      ...(status === "READY" || status === "DEGRADED"
        ? { lastSuccessAt: new Date(), lastErrorCode: null }
        : {}),
    });
  }

  return report;
}

export async function getAnalyticsReadiness() {
  const health = await getAnalyticsHealth(false);
  return {
    ready: health.ready,
    status: health.status,
    checks: {
      tracking: health.trackingConfigured,
      dataApi: health.dataApiConfigured,
      catalog: health.catalogEventCount > 0,
    },
  };
}

export async function getAnalyticsLiveness() {
  return { alive: true, ts: new Date().toISOString(), version: ANALYTICS_MODULE_VERSION };
}
