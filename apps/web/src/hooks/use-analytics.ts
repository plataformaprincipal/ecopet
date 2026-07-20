"use client";

import { useCallback, useMemo } from "react";
import {
  getGaMeasurementId,
  isGaConfigured,
  isGaDebugEnabled,
  maskMeasurementId,
  shouldSendToGoogle,
} from "@/lib/analytics/config";
import {
  grantAnalyticsConsent,
  hasAnalyticsConsent,
  resolveEffectiveConsent,
  revokeAnalyticsConsent,
  updateConsent,
} from "@/lib/analytics/consent";
import { analyticsService } from "@/lib/analytics/service";
import { isGoogleAnalyticsReady } from "@/lib/analytics/client";
import type { TrackableEvent } from "@/lib/analytics/factory";
import type { AnalyticsEventParams, ConsentSettings, PageViewInput } from "@/lib/analytics/types";

/** API unificada de analytics no cliente. */
export function useAnalytics() {
  const configured = isGaConfigured();
  const enabled = shouldSendToGoogle();
  const consent = resolveEffectiveConsent();

  const track = useCallback(
    (
      event: TrackableEvent,
      options?: { label?: string; value?: number; params?: AnalyticsEventParams }
    ) => analyticsService.track(event, options).sent,
    []
  );

  const pageView = useCallback((input: PageViewInput) => analyticsService.pageView(input), []);

  const grant = useCallback(() => grantAnalyticsConsent(), []);
  const revoke = useCallback(() => revokeAnalyticsConsent(), []);
  const setConsent = useCallback(
    (partial: Partial<ConsentSettings>) => updateConsent(partial),
    []
  );

  return useMemo(
    () => ({
      configured,
      enabled,
      ready: typeof window !== "undefined" ? isGoogleAnalyticsReady() : false,
      hasConsent: hasAnalyticsConsent(),
      consent,
      measurementIdMasked: maskMeasurementId(getGaMeasurementId()),
      debug: isGaDebugEnabled(),
      catalogSize: analyticsService.catalogSize(),
      track,
      pageView,
      setUser: analyticsService.setUser,
      grantConsent: grant,
      revokeConsent: revoke,
      updateConsent: setConsent,
    }),
    [configured, enabled, consent, track, pageView, grant, revoke, setConsent]
  );
}
