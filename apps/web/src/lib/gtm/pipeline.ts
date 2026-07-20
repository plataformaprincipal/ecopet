import { hasAnalyticsConsent, resolveEffectiveConsent } from "@/lib/analytics/consent";
import { detectGtmEnvironment, shouldLoadGtm } from "./config";
import { GTM_EVENT_VERSION, type GtmPipelineResult, type GtmTelemetryPayload } from "./contract";
import { buildDedupeKey, shouldDedupeEvent } from "./deduplication";
import { sanitizeDataLayerParams } from "./event-sanitizer";
import { validateTelemetryPayload } from "./event-validator";
import { pushToDataLayer } from "./datalayer";
import { recordPipelineMetric } from "./metrics";
import { getGtmAnonymousSessionId, newEventId } from "./session";
import { gtmLog } from "./logger";

export type PushTelemetryOptions = {
  /** Chave extra de dedupe (ex.: order_id). */
  dedupeParts?: Array<string | number | undefined | null>;
  dedupeTtlMs?: number;
  /** Se false, ignora shouldLoadGtm (ainda exige window). Default true. */
  requireGtmEnabled?: boolean;
  skipConsent?: boolean;
};

/**
 * Pipeline central Data Layer — único caminho tipado para telemetria GTM.
 * Não envia ao gtag (GA4 permanece no dispatcher analytics).
 */
export function pushTelemetryEvent(
  payload: GtmTelemetryPayload,
  options: PushTelemetryOptions = {}
): GtmPipelineResult {
  if (typeof window === "undefined") {
    return { pushed: false, reason: "ssr" };
  }

  const requireGtm = options.requireGtmEnabled !== false;
  if (requireGtm && !shouldLoadGtm()) {
    recordPipelineMetric("gtm_disabled", payload.event);
    return { pushed: false, reason: "gtm_disabled", event: payload.event };
  }

  if (!options.skipConsent && !hasAnalyticsConsent()) {
    recordPipelineMetric("no_consent", payload.event);
    return { pushed: false, reason: "no_consent", event: payload.event };
  }

  const validation = validateTelemetryPayload(payload);
  if (!validation.ok) {
    recordPipelineMetric("invalid_name", payload.event);
    gtmLog("warn", "telemetry rejected", { error: validation.error });
    return { pushed: false, reason: "invalid_name", event: payload.event };
  }

  const eventId = payload.event_id ?? newEventId();
  const dedupeKey = buildDedupeKey(payload.ga_event ?? payload.event, [
    ...(options.dedupeParts ?? []),
    payload.transaction_id,
  ]);
  if (shouldDedupeEvent(dedupeKey, options.dedupeTtlMs)) {
    recordPipelineMetric("duplicate", payload.event);
    return { pushed: false, reason: "duplicate", event: payload.event, eventId };
  }

  const consent = resolveEffectiveConsent();
  const cleaned = sanitizeDataLayerParams({
    ...payload,
    event: undefined,
    event_id: eventId,
    event_version: payload.event_version ?? GTM_EVENT_VERSION,
    session_id: payload.session_id ?? getGtmAnonymousSessionId(),
    environment: payload.environment ?? detectGtmEnvironment(),
    consent_state: payload.consent_state ?? consent.analytics_storage,
  } as Record<string, unknown>);

  try {
    const ok = pushToDataLayer({
      event: payload.event,
      ...cleaned,
    });
    if (!ok) {
      recordPipelineMetric("error", payload.event);
      return { pushed: false, reason: "error", event: payload.event, eventId };
    }
    recordPipelineMetric("ok", payload.event);
    return { pushed: true, reason: "ok", event: payload.event, eventId };
  } catch {
    recordPipelineMetric("error", payload.event);
    return { pushed: false, reason: "error", event: payload.event, eventId };
  }
}
