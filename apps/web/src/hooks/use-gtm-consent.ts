"use client";

import { useCallback } from "react";
import { updateConsent, type ConsentChoiceSource } from "@/lib/analytics/consent";
import type { ConsentSettings } from "@/lib/analytics/types";
import { syncGtmConsent } from "@/lib/gtm";

/**
 * Atualiza Consent Mode (analytics) e espelha no dataLayer GTM.
 */
export function useGtmConsent() {
  return useCallback((partial: Partial<ConsentSettings>, source: ConsentChoiceSource = "settings") => {
    const next = updateConsent(partial, source);
    syncGtmConsent(next);
    return next;
  }, []);
}
