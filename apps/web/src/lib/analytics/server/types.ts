import type { AnalyticsSanitizedStatus } from "../types";

export type AnalyticsOpsStatus =
  | "READY"
  | "DEGRADED"
  | "NOT_CONFIGURED"
  | "ERROR"
  | "DISABLED"
  | "UNKNOWN";

export type AnalyticsConfigFlags = {
  /** Log debug server-side (nunca Measurement ID completo). */
  debugLogging?: boolean;
  /** TTL cache em segundos (5–300). */
  cacheTtlSec?: number;
  /** Health check automático via JobQueue. */
  healthJobsEnabled?: boolean;
};

export type AnalyticsHealthReport = {
  status: AnalyticsOpsStatus;
  alive: boolean;
  ready: boolean;
  trackingConfigured: boolean;
  dataApiConfigured: boolean;
  sendToGoogle: boolean;
  catalogEventCount: number;
  lastHealthAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorCode: string | null;
  avgResponseMs: number | null;
  environment: string;
  version: string;
  build: string | null;
};

export type AnalyticsDiagnosticsReport = {
  provider: string;
  version: string;
  status: AnalyticsSanitizedStatus;
  measurementIdConfigured: boolean;
  measurementIdMasked: string | null;
  propertyIdMasked: string | null;
  dataApiStatus: string;
  sendToGoogle: boolean;
  consentMode: string;
  catalogEventCount: number;
  scriptHosts: string[];
  notes: string[];
  health: AnalyticsHealthReport;
  cache: { hits: number; misses: number; size: number; ttlSec: number };
  queue: { pending: number; failed: number; supported: boolean };
  ops: {
    lastSyncAt: string | null;
    lastErrorCode: string | null;
    configFlags: AnalyticsConfigFlags;
  };
  responseMs: number;
};

export type AnalyticsStatusReport = {
  active: boolean;
  provider: string;
  environment: string;
  trackingStatus: string;
  dataApiStatus: string;
  health: AnalyticsOpsStatus;
  measurementIdMasked: string | null;
  catalogEventCount: number;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
};

export const ANALYTICS_PROVIDER = "google_analytics" as const;
export const ANALYTICS_MODULE_VERSION = "1.0.0-ops";
