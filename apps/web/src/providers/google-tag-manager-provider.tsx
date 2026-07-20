"use client";

import Script from "next/script";
import { useEffect } from "react";
import { applyConsentDefaults } from "@/lib/analytics/consent";
import {
  bootstrapGtmContainer,
  getGtmContainerId,
  getGtmNoscriptSrc,
  getGtmScriptSrc,
  markGtmReady,
  shouldLoadGtm,
} from "@/lib/gtm";
import { gtmLog } from "@/lib/gtm/logger";

/**
 * Google Tag Manager — App Router (next/script afterInteractive).
 * Complementa GA4; não substitui o GoogleAnalyticsProvider.
 */
export function GoogleTagManagerProvider({ children }: { children?: React.ReactNode }) {
  const containerId = getGtmContainerId();
  const enabled = Boolean(containerId && shouldLoadGtm());

  useEffect(() => {
    if (!enabled) return;
    // Consent Mode v2 defaults antes do container (compartilhado com GA4).
    applyConsentDefaults();
    bootstrapGtmContainer();
  }, [enabled]);

  if (!enabled || !containerId) {
    return <>{children}</>;
  }

  return (
    <>
      <Script
        id="ecopet-gtm"
        src={getGtmScriptSrc(containerId)}
        strategy="afterInteractive"
        onLoad={() => {
          markGtmReady(true);
          gtmLog("info", "GTM script loaded");
        }}
        onError={() => {
          markGtmReady(false);
          gtmLog("error", "GTM script failed to load");
        }}
      />
      <noscript>
        <iframe
          title="Google Tag Manager"
          src={getGtmNoscriptSrc(containerId)}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
      {children}
    </>
  );
}
