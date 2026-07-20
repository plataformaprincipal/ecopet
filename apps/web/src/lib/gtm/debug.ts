import { getGtmSanitizedStatus, isGtmDebugEnabled } from "./config";
import { isGtmReady } from "./container";

export function getGtmDebugSnapshot() {
  const status = getGtmSanitizedStatus();
  return {
    ...status,
    ready: typeof window !== "undefined" ? isGtmReady() : false,
    debugFlag: isGtmDebugEnabled(),
    lastEvent: typeof window !== "undefined" ? window.__ecopetGtmLastEvent ?? null : null,
    lastError: typeof window !== "undefined" ? window.__ecopetGtmLastError ?? null : null,
    dataLayerLength:
      typeof window !== "undefined" && Array.isArray(window.dataLayer)
        ? window.dataLayer.length
        : 0,
  };
}
