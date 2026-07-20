import type { ConsentSettings } from "@/lib/analytics/types";
import { pushConsent } from "./datalayer";
import { shouldLoadGtm } from "./config";
import { gtmLog } from "./logger";

/**
 * Espelha Consent Mode v2 no dataLayer para tags GTM.
 * Não substitui gtag("consent") — isso permanece no módulo analytics.
 */
export function syncGtmConsent(settings: ConsentSettings): void {
  if (typeof window === "undefined") return;
  if (!shouldLoadGtm()) return;
  pushConsent(settings);
  gtmLog("debug", "consent mirrored to GTM dataLayer", {
    analytics: settings.analytics_storage,
  });
}
