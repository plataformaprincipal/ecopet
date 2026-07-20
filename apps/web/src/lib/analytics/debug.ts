import { getAnalyticsSanitizedStatus, isGaDebugEnabled } from "./config";

export function getClientAnalyticsDebugSnapshot(): {
  status: ReturnType<typeof getAnalyticsSanitizedStatus>;
  ready: boolean;
  lastPage: string | null;
  lastError: string | null;
  debug: boolean;
} {
  const status = getAnalyticsSanitizedStatus();
  if (typeof window === "undefined") {
    return {
      status,
      ready: false,
      lastPage: null,
      lastError: null,
      debug: isGaDebugEnabled(),
    };
  }
  return {
    status,
    ready: Boolean(window.__ecopetGaReady),
    lastPage: window.__ecopetGaLastPage ?? null,
    lastError: window.__ecopetGaLastError ?? null,
    debug: isGaDebugEnabled(),
  };
}
