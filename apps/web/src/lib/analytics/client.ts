"use client";

import {
  getGaMeasurementId,
  isGaDebugEnabled,
  shouldSendToGoogle,
} from "./config";
import { applyConsentDefaults, hasAnalyticsConsent } from "./consent";
import { analyticsLog } from "./logger";
import { trackPageView } from "./pageviews";

/**
 * Inicializa dataLayer + consent defaults + config GA4.
 * Chamado após o script gtag.js carregar (ou antes, para consent default).
 */
export function initGoogleAnalyticsClient(): boolean {
  if (typeof window === "undefined") return false;

  const measurementId = getGaMeasurementId();
  if (!measurementId || !shouldSendToGoogle()) {
    analyticsLog("debug", "init skipped — not configured or send disabled");
    return false;
  }

  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag(...args: unknown[]) {
        window.dataLayer!.push(args);
      };

    applyConsentDefaults();

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false, // page_view controlado pelo App Router
      anonymize_ip: true,
      debug_mode: isGaDebugEnabled() || undefined,
    });

    window.__ecopetGaReady = true;
    analyticsLog("info", "GA4 client initialized", {
      consent: hasAnalyticsConsent() ? "granted" : "denied",
    });

    // Page view inicial (efeito SPA pode ter rodado antes do gtag estar pronto).
    trackPageView({
      path: `${window.location.pathname}${window.location.search}`,
      title: document.title,
    });
    return true;
  } catch (err) {
    window.__ecopetGaLastError = err instanceof Error ? err.name : "INIT_ERROR";
    analyticsLog("error", "GA4 init failed");
    return false;
  }
}

export function isGoogleAnalyticsReady(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      window.__ecopetGaReady &&
      typeof window.gtag === "function"
  );
}

export {
  trackEvent,
  AnalyticsEvents,
} from "./events";

export { trackPageView } from "./pageviews";

export {
  grantAnalyticsConsent,
  revokeAnalyticsConsent,
  updateConsent,
  hasAnalyticsConsent,
  resolveEffectiveConsent,
  getStoredConsent,
} from "./consent";

export {
  getGaMeasurementId,
  shouldSendToGoogle,
  isGaConfigured,
  isGaDebugEnabled,
  maskMeasurementId,
} from "./config";
