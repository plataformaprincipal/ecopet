import { getDefaultConsentSettings } from "./config";
import { analyticsLog } from "./logger";
import type { ConsentSettings, ConsentState } from "./types";

export const CONSENT_STORAGE_KEY = "ecopet.analytics.consent.v1";
/** Marca que o usuário respondeu ao banner (CMP-ready). */
export const CONSENT_CHOICE_KEY = "ecopet.analytics.consent.choice.v1";

export type ConsentChoiceSource = "banner" | "settings" | "cmp" | "api" | "default";

export function getStoredConsent(): ConsentSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentSettings>;
    if (!parsed.analytics_storage) return null;
    return {
      analytics_storage: parsed.analytics_storage === "granted" ? "granted" : "denied",
      ad_storage: parsed.ad_storage === "granted" ? "granted" : "denied",
      ad_user_data: parsed.ad_user_data === "granted" ? "granted" : "denied",
      ad_personalization: parsed.ad_personalization === "granted" ? "granted" : "denied",
    };
  } catch {
    return null;
  }
}

/** True se o usuário já escolheu (banner/CMP/settings) — evita reabrir o banner. */
export function hasConsentChoice(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(CONSENT_CHOICE_KEY) === "1" || getStoredConsent() !== null;
  } catch {
    return false;
  }
}

function markConsentChoice(source: ConsentChoiceSource): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_CHOICE_KEY, "1");
    localStorage.setItem(`${CONSENT_CHOICE_KEY}.source`, source);
  } catch {
    /* private mode */
  }
}

export function persistConsent(settings: ConsentSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* quota / private mode */
  }
}

export function resolveEffectiveConsent(): ConsentSettings {
  return getStoredConsent() ?? getDefaultConsentSettings();
}

export function hasAnalyticsConsent(): boolean {
  return resolveEffectiveConsent().analytics_storage === "granted";
}

/** Consent Mode v2 — defaults antes do gtag carregar. */
export function applyConsentDefaults(): void {
  if (typeof window === "undefined") return;
  const consent = resolveEffectiveConsent();
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  window.gtag("consent", "default", {
    analytics_storage: consent.analytics_storage,
    ad_storage: consent.ad_storage,
    ad_user_data: consent.ad_user_data,
    ad_personalization: consent.ad_personalization,
    wait_for_update: 500,
  });
  analyticsLog("debug", "consent defaults applied", {
    analytics: consent.analytics_storage,
  });
}

export function updateConsent(
  settings: Partial<ConsentSettings>,
  source: ConsentChoiceSource = "settings"
): ConsentSettings {
  const next: ConsentSettings = {
    ...resolveEffectiveConsent(),
    ...settings,
  };
  persistConsent(next);
  markConsentChoice(source);
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: next.analytics_storage,
      ad_storage: next.ad_storage,
      ad_user_data: next.ad_user_data,
      ad_personalization: next.ad_personalization,
    });
  }
  // Espelho Consent Mode → dataLayer GTM (sem CMP externa).
  void import("@/lib/gtm/consent")
    .then(({ syncGtmConsent }) => syncGtmConsent(next))
    .catch(() => undefined);
  analyticsLog("info", "consent updated", { analytics: next.analytics_storage, source });
  return next;
}

export function grantAnalyticsConsent(): ConsentSettings {
  return updateConsent({ analytics_storage: "granted" as ConsentState }, "settings");
}

/** Aceitar analytics (+ ads opcional) via banner. */
export function acceptAllConsent(): ConsentSettings {
  return updateConsent(
    {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    },
    "banner"
  );
}

/** Apenas essenciais — analytics/ads denied (LGPD default). */
export function acceptNecessaryOnly(): ConsentSettings {
  return updateConsent(
    {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
    "banner"
  );
}

export function revokeAnalyticsConsent(): ConsentSettings {
  return updateConsent(
    {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
    "settings"
  );
}

/**
 * Ponto de extensão CMP externo (OneTrust, Cookiebot, etc.).
 * Não implementa plataforma — apenas contrato.
 */
export function applyExternalCmpConsent(
  settings: ConsentSettings,
  cmpId?: string
): ConsentSettings {
  analyticsLog("info", "cmp consent bridge", { cmp: cmpId ?? "external" });
  return updateConsent(settings, "cmp");
}
