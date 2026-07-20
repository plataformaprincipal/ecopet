import { dispatchAnalyticsEvent, type DispatchResult } from "./dispatcher";
import type { EventFactoryInput, TrackableEvent } from "./factory";
import type { AnalyticsEventParams } from "./types";
import { setAnalyticsUser, type AnalyticsUserContext } from "./context";
import { trackPageView } from "./pageviews";
import type { PageViewInput } from "./types";
import { grantAnalyticsConsent, revokeAnalyticsConsent, hasAnalyticsConsent } from "./consent";
import { countCatalogEvents } from "./events/catalog";

/**
 * Analytics Service — API única para a aplicação.
 * Preferir este serviço (ou hooks) em vez de chamar gtag direto.
 */
export const analyticsService = {
  track(
    event: TrackableEvent,
    options?: Omit<EventFactoryInput, "event"> & { params?: AnalyticsEventParams }
  ): DispatchResult {
    return dispatchAnalyticsEvent({
      event,
      label: options?.label,
      value: options?.value,
      params: options?.params,
      screen: options?.screen,
      country: options?.country,
      state: options?.state,
      city: options?.city,
    });
  },

  trackEvent(input: EventFactoryInput): DispatchResult {
    return dispatchAnalyticsEvent(input);
  },

  pageView(input: PageViewInput): boolean {
    return trackPageView(input);
  },

  setUser(ctx: AnalyticsUserContext | null) {
    setAnalyticsUser(ctx);
  },

  grantConsent() {
    return grantAnalyticsConsent();
  },

  revokeConsent() {
    return revokeAnalyticsConsent();
  },

  hasConsent() {
    return hasAnalyticsConsent();
  },

  catalogSize() {
    return countCatalogEvents();
  },
};

export type AnalyticsService = typeof analyticsService;
