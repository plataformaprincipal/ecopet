import "server-only";

export { AnalyticsServerService } from "./service";
export { getAnalyticsModule } from "./module";
export { requireAnalyticsAdmin } from "./security";
export { validateConfigFlags } from "./validator";
export { writeAnalyticsAudit } from "./audit";
export { clearAnalyticsCache, analyticsCacheStats } from "./cache";
export { withAnalyticsAdminRoute } from "./http";
export {
  ANALYTICS_PROVIDER,
  ANALYTICS_MODULE_VERSION,
  type AnalyticsConfigFlags,
  type AnalyticsDiagnosticsReport,
  type AnalyticsHealthReport,
  type AnalyticsStatusReport,
} from "./types";

/** Compat Prompt 1 — diagnostics legado. */
export { getGoogleAnalyticsAdminDiagnostics } from "../server-compat";
