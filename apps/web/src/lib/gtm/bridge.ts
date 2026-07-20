import { shouldLoadGtm } from "./config";
import { GtmEvents } from "./events";
import { gtmLog } from "./logger";
import { pushTelemetryEvent } from "./pipeline";
import { buildEcommerceParams, type GtmEcommercePayload } from "./ecommerce";
import { claimTransactionalOnce } from "./deduplication";

/**
 * Ponte GA4 → GTM (espelho namespaced via pipeline tipado).
 * Estratégia B: gtag permanece dono do hit GA4; GTM não deve republicar o mesmo evento.
 */
export function mirrorGaEventToGtm(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined | null>
): void {
  if (!shouldLoadGtm()) return;

  // purchase/refund — dedupe transacional no espelho
  const tx = params?.order_id ?? params?.transaction_id;
  if (
    (eventName === "purchase" || eventName === "refund") &&
    tx != null &&
    !claimTransactionalOnce(`gtm_${eventName}`, String(tx))
  ) {
    gtmLog("debug", "gtm mirror skipped — transactional duplicate", { eventName });
    return;
  }

  pushTelemetryEvent(
    {
      event: GtmEvents.GA_MIRROR,
      ga_event: eventName,
      module: typeof params?.module === "string" ? params.module : undefined,
      action: typeof params?.event_action === "string" ? params.event_action : undefined,
      value: typeof params?.value === "number" ? params.value : undefined,
      currency: typeof params?.currency === "string" ? params.currency : undefined,
      transaction_id: tx != null ? String(tx) : undefined,
      source: "gtag_mirror",
      ...params,
    },
    {
      dedupeParts: [eventName, tx != null ? String(tx) : undefined],
      dedupeTtlMs: eventName === "page_view" ? 1500 : 2500,
    }
  );
}

export function mirrorGaPageViewToGtm(input: {
  path: string;
  title?: string;
  locale?: string;
}): void {
  if (!shouldLoadGtm()) return;
  pushTelemetryEvent(
    {
      event: GtmEvents.PAGE_VIEW,
      page_path: input.path,
      page_title: input.title,
      language: input.locale,
      source: "page",
      module: "shared",
      action: "page_view",
    },
    { dedupeParts: [input.path], dedupeTtlMs: 1500 }
  );
}

/** Push ecommerce estruturado (namespaced) — complementar ao gtag. */
export function pushGtmEcommerce(action: string, payload: GtmEcommercePayload) {
  if (!shouldLoadGtm()) return { pushed: false as const, reason: "gtm_disabled" as const };
  const params = buildEcommerceParams(action, payload);
  return pushTelemetryEvent(
    {
      event: GtmEvents.ECOMMERCE,
      source: "ecommerce",
      module: "marketplace",
      action,
      ...params,
    },
    {
      dedupeParts: [action, payload.transaction_id],
      dedupeTtlMs: action === "purchase" ? 60_000 : 2500,
    }
  );
}
