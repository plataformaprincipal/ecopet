import { claimTransactionalOnce } from "@/lib/gtm/deduplication";
import { getGaMeasurementId, shouldSendToGoogle } from "./config";
import { hasAnalyticsConsent } from "./consent";
import { analyticsLog } from "./logger";
import { isSafeEventName, sanitizeEventParams } from "./sanitize";
import { buildAnalyticsEvent, type EventFactoryInput } from "./factory";

export type DispatchResult = {
  sent: boolean;
  reason?:
    | "ssr"
    | "send_disabled"
    | "no_consent"
    | "unsafe_name"
    | "gtag_unavailable"
    | "no_measurement_id"
    | "duplicate"
    | "error"
    | "ok";
  name?: string;
};

/**
 * Event Dispatcher — único ponto de envio ao gtag.
 * Respeita Consent Mode / shouldSendToGoogle / sanitize.
 */
export function dispatchAnalyticsEvent(input: EventFactoryInput): DispatchResult {
  if (typeof window === "undefined") {
    return { sent: false, reason: "ssr" };
  }

  const built = buildAnalyticsEvent(input);

  if (!shouldSendToGoogle()) {
    analyticsLog("debug", "dispatch skipped — send disabled", { name: built.name });
    return { sent: false, reason: "send_disabled", name: built.name };
  }
  if (!hasAnalyticsConsent()) {
    analyticsLog("debug", "dispatch skipped — no consent", { name: built.name });
    return { sent: false, reason: "no_consent", name: built.name };
  }
  if (!isSafeEventName(built.name)) {
    analyticsLog("warn", "dispatch rejected — unsafe name", { name: built.name });
    return { sent: false, reason: "unsafe_name", name: built.name };
  }
  if (typeof window.gtag !== "function") {
    analyticsLog("debug", "dispatch skipped — gtag unavailable", { name: built.name });
    return { sent: false, reason: "gtag_unavailable", name: built.name };
  }

  const measurementId = getGaMeasurementId();
  if (!measurementId) {
    return { sent: false, reason: "no_measurement_id", name: built.name };
  }

  try {
    const params = sanitizeEventParams(built.params);
    // Dedup purchase/refund por order_id / transaction_id (reload/sucesso duplo).
    const tx = params.order_id ?? params.transaction_id;
    if (
      (built.name === "purchase" || built.name === "refund") &&
      tx != null &&
      !claimTransactionalOnce(`ga_${built.name}`, String(tx))
    ) {
      analyticsLog("debug", "dispatch skipped — transactional duplicate", {
        name: built.name,
      });
      return { sent: false, reason: "duplicate", name: built.name };
    }

    window.gtag("event", built.name, {
      ...params,
      send_to: measurementId,
    });
    // Ponte GTM (espelho namespaced) — Estratégia B: sem segundo hit GA4.
    void import("@/lib/gtm/bridge")
      .then(({ mirrorGaEventToGtm }) => mirrorGaEventToGtm(built.name, params))
      .catch(() => undefined);
    analyticsLog("debug", "dispatch sent", { name: built.name, module: params.module });
    return { sent: true, reason: "ok", name: built.name };
  } catch (err) {
    window.__ecopetGaLastError = err instanceof Error ? err.name : "DISPATCH_ERROR";
    analyticsLog("error", "dispatch failed", { name: built.name });
    return { sent: false, reason: "error", name: built.name };
  }
}
