import {
  getGaMeasurementId,
  isAnalyticsExcludedPath,
  shouldSendToGoogle,
} from "./config";
import { hasAnalyticsConsent } from "./consent";
import { analyticsLog } from "./logger";
import { sanitizePath } from "./sanitize";
import type { PageViewInput } from "./types";

/**
 * Page view SPA — dedupe pelo path sanitizado.
 * Ignora rotas admin/API/auth.
 */
export function trackPageView(input: PageViewInput): boolean {
  if (typeof window === "undefined") return false;
  if (!shouldSendToGoogle()) return false;
  if (!hasAnalyticsConsent()) {
    analyticsLog("debug", "page_view skipped — no consent");
    return false;
  }

  const path = sanitizePath(input.path || window.location.pathname);
  if (isAnalyticsExcludedPath(path)) {
    analyticsLog("debug", "page_view skipped — excluded path");
    return false;
  }

  if (window.__ecopetGaLastPage === path) {
    analyticsLog("debug", "page_view skipped — duplicate");
    return false;
  }

  if (typeof window.gtag !== "function") return false;
  const measurementId = getGaMeasurementId();
  if (!measurementId) return false;

  try {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: input.title || document.title,
      page_location: `${window.location.origin}${path}`,
      language: input.locale || document.documentElement.lang || undefined,
      send_to: measurementId,
    });
    window.__ecopetGaLastPage = path;
    // Espelho GTM namespaced (ecopet_page_view) — evita page_view duplicado no container.
    void import("@/lib/gtm/bridge")
      .then(({ mirrorGaPageViewToGtm }) =>
        mirrorGaPageViewToGtm({
          path,
          title: input.title || document.title,
          locale: input.locale,
        })
      )
      .catch(() => undefined);
    analyticsLog("debug", "page_view sent", { path });
    return true;
  } catch (err) {
    window.__ecopetGaLastError = err instanceof Error ? err.name : "PAGEVIEW_ERROR";
    analyticsLog("error", "page_view failed");
    return false;
  }
}
