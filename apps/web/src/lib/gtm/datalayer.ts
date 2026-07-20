import { sanitizeEventParams } from "@/lib/analytics/sanitize";
import { gtmLog } from "./logger";
import { shouldLoadGtm } from "./config";
import type { GtmDataLayerObject } from "./types";

/** Garante dataLayer antes do script GTM / gtag. */
export function ensureDataLayer(): unknown[] {
  if (typeof window === "undefined") return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/**
 * Push genérico — único ponto de escrita no dataLayer (app).
 * Não envia PII (sanitize).
 */
export function pushToDataLayer(payload: GtmDataLayerObject): boolean {
  if (typeof window === "undefined") return false;
  try {
    const layer = ensureDataLayer();
    const { event, ...rest } = payload;
    const cleaned = sanitizeEventParams(rest as Record<string, string | number | boolean>);
    const entry: GtmDataLayerObject = event ? { event, ...cleaned } : { ...cleaned };
    layer.push(entry);
    if (event) window.__ecopetGtmLastEvent = event;
    gtmLog("debug", "dataLayer.push", { event: event ?? "(object)" });
    return true;
  } catch (err) {
    if (typeof window !== "undefined") {
      window.__ecopetGtmLastError = err instanceof Error ? err.name : "DATALAYER_ERROR";
    }
    gtmLog("error", "dataLayer.push failed");
    return false;
  }
}

export function pushEvent(
  event: string,
  params?: Record<string, string | number | boolean | undefined | null>
): boolean {
  return pushToDataLayer({ event, ...params });
}

export function pushPage(input: {
  path: string;
  title?: string;
  locale?: string;
}): boolean {
  return pushEvent("ecopet_page_view", {
    page_path: input.path,
    page_title: input.title,
    language: input.locale,
  });
}

export function pushEcommerce(action: string, payload: Record<string, unknown>): boolean {
  const cleaned = sanitizeEventParams(
    payload as Record<string, string | number | boolean | undefined | null>
  );
  return pushEvent("ecopet_ecommerce", { ecommerce_action: action, ...cleaned });
}

export function pushUser(user: {
  user_id_hash?: string;
  role?: string;
  logged_in?: boolean;
}): boolean {
  return pushToDataLayer({
    event: "ecopet_user",
    user_id_hash: user.user_id_hash,
    role: user.role,
    logged_in: user.logged_in,
  });
}

export function pushConsent(settings: {
  analytics_storage: string;
  ad_storage: string;
  ad_user_data: string;
  ad_personalization: string;
}): boolean {
  return pushEvent("ecopet_consent_update", {
    analytics_storage: settings.analytics_storage,
    ad_storage: settings.ad_storage,
    ad_user_data: settings.ad_user_data,
    ad_personalization: settings.ad_personalization,
  });
}

/** Espelho opcional — só quando container deve carregar. */
export function pushIfGtmEnabled(
  event: string,
  params?: Record<string, string | number | boolean | undefined | null>
): boolean {
  if (!shouldLoadGtm()) return false;
  return pushEvent(event, params);
}
