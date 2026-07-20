export type GtmPipelineMetrics = {
  pushed: number;
  blockedConsent: number;
  blockedDuplicate: number;
  blockedValidation: number;
  blockedSanitize: number;
  errors: number;
  lastEvent: string | null;
  lastReason: string | null;
  updatedAt: string | null;
};

const metrics: GtmPipelineMetrics = {
  pushed: 0,
  blockedConsent: 0,
  blockedDuplicate: 0,
  blockedValidation: 0,
  blockedSanitize: 0,
  errors: 0,
  lastEvent: null,
  lastReason: null,
  updatedAt: null,
};

export function recordPipelineMetric(
  reason: string,
  event?: string
): void {
  metrics.updatedAt = new Date().toISOString();
  metrics.lastReason = reason;
  if (event) metrics.lastEvent = event;
  if (reason === "ok") metrics.pushed += 1;
  else if (reason === "no_consent") metrics.blockedConsent += 1;
  else if (reason === "duplicate") metrics.blockedDuplicate += 1;
  else if (reason === "invalid_name") metrics.blockedValidation += 1;
  else if (reason === "sanitized_empty" || reason === "blocked_pii")
    metrics.blockedSanitize += 1;
  else if (reason === "error") metrics.errors += 1;

  if (typeof window !== "undefined") {
    window.__ecopetGtmMetrics = { ...metrics };
  }
}

export function getPipelineMetrics(): GtmPipelineMetrics {
  return { ...metrics };
}

declare global {
  interface Window {
    __ecopetGtmMetrics?: GtmPipelineMetrics;
  }
}
