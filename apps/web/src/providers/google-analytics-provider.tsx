"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getGaMeasurementId,
  shouldSendToGoogle,
} from "@/lib/analytics/config";
import {
  initGoogleAnalyticsClient,
  isGoogleAnalyticsReady,
} from "@/lib/analytics/client";
import { applyConsentDefaults } from "@/lib/analytics/consent";
import { trackPageView } from "@/lib/analytics/pageviews";
import { analyticsLog } from "@/lib/analytics/logger";

/**
 * Page views SPA — Suspense obrigatório (useSearchParams).
 * Deduplica e exclui /admin, /api, auth.
 */
function GoogleAnalyticsPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!shouldSendToGoogle()) return;
    if (!isGoogleAnalyticsReady() && typeof window.gtag !== "function") return;

    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname || "/";
    trackPageView({ path, title: typeof document !== "undefined" ? document.title : undefined });
  }, [pathname, searchParams]);

  return null;
}

/**
 * GA4 App Router — carrega só quando envio está habilitado (prod / flags).
 * Consent Mode v2 defaults antes do config; send_page_view desligado (manual).
 */
export function GoogleAnalyticsProvider({ children }: { children?: React.ReactNode }) {
  const measurementId = getGaMeasurementId();
  const enabled = Boolean(measurementId && shouldSendToGoogle());

  useEffect(() => {
    if (!enabled) return;
    // Consent Mode v2 defaults o mais cedo possível no cliente.
    applyConsentDefaults();
  }, [enabled]);

  if (!enabled || !measurementId) {
    return <>{children}</>;
  }

  return (
    <>
      <Script
        id="ecopet-ga4-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          const ok = initGoogleAnalyticsClient();
          if (!ok) {
            analyticsLog("warn", "GA4 onLoad init returned false");
          }
        }}
        onError={() => {
          if (typeof window !== "undefined") {
            window.__ecopetGaLastError = "SCRIPT_LOAD_ERROR";
          }
          analyticsLog("error", "GA4 script failed to load (blocked/offline/adblock)");
        }}
      />
      <Suspense fallback={null}>
        <GoogleAnalyticsPageViews />
      </Suspense>
      {children}
    </>
  );
}
