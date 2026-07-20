"use client";

import { useCallback, useMemo } from "react";
import {
  ensureDataLayer,
  getPipelineMetrics,
  pushGtmEcommerce,
  pushTelemetryEvent,
  shouldLoadGtm,
  syncGtmConsent,
} from "@/lib/gtm";
import type { GtmEcommercePayload } from "@/lib/gtm/ecommerce";
import type { GtmTelemetryPayload } from "@/lib/gtm/contract";
import { updateConsent } from "@/lib/analytics/consent";
import type { ConsentSettings } from "@/lib/analytics/types";

/** Hook unificado GTM / Data Layer (não substitui useAnalytics/gtag). */
export function useGtm() {
  const enabled = shouldLoadGtm();

  const push = useCallback(
    (payload: GtmTelemetryPayload, dedupeParts?: Array<string | number | undefined | null>) =>
      pushTelemetryEvent(payload, { dedupeParts }),
    []
  );

  const ecommerce = useCallback(
    (action: string, payload: GtmEcommercePayload) => pushGtmEcommerce(action, payload),
    []
  );

  const setConsent = useCallback((partial: Partial<ConsentSettings>) => {
    const next = updateConsent(partial, "settings");
    syncGtmConsent(next);
    return next;
  }, []);

  return useMemo(
    () => ({
      enabled,
      ensureDataLayer,
      push,
      ecommerce,
      setConsent,
      metrics: getPipelineMetrics,
    }),
    [enabled, push, ecommerce, setConsent]
  );
}
