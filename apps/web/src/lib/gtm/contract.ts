/** Contrato tipado do Data Layer EcoPet (event_version = 1). */

export const GTM_EVENT_VERSION = 1 as const;

export type GtmConsentState = "granted" | "denied" | "unknown";

export type GtmPipelineResult = {
  pushed: boolean;
  reason?:
    | "ssr"
    | "gtm_disabled"
    | "no_consent"
    | "invalid_name"
    | "duplicate"
    | "sanitized_empty"
    | "blocked_pii"
    | "error"
    | "ok";
  event?: string;
  eventId?: string;
};

export type GtmTelemetryPayload = {
  /** Nome do evento GA4 ou namespaced EcoPet. */
  event: string;
  /** Nome GA4 quando event é espelho (ecopet_ga_event). */
  ga_event?: string;
  event_id?: string;
  event_version?: number;
  module?: string;
  action?: string;
  page_path?: string;
  page_title?: string;
  language?: string;
  environment?: string;
  session_id?: string;
  consent_state?: GtmConsentState;
  source?: "gtag_mirror" | "direct" | "ecommerce" | "page" | "consent";
  feature?: string;
  result?: string;
  error_code?: string;
  currency?: string;
  value?: number;
  transaction_id?: string;
  [key: string]: string | number | boolean | undefined | null;
};
