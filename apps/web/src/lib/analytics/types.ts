export type AnalyticsEnvironment = "development" | "preview" | "production" | "test" | "unknown";

export type ConsentState = "granted" | "denied";

export type ConsentSettings = {
  analytics_storage: ConsentState;
  ad_storage: ConsentState;
  ad_user_data: ConsentState;
  ad_personalization: ConsentState;
};

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined | null>;

export type TrackEventInput = {
  name: string;
  params?: AnalyticsEventParams;
};

export type PageViewInput = {
  path: string;
  title?: string;
  locale?: string;
};

export type AnalyticsSanitizedStatus = {
  configured: boolean;
  enabled: boolean;
  measurementIdMasked: string | null;
  environment: AnalyticsEnvironment;
  sendToGoogle: boolean;
  debug: boolean;
  consentDefault: ConsentSettings;
  status: "READY" | "DISABLED" | "DEV_ONLY" | "MISSING" | "INVALID_ID";
  sanitizedMessage: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __ecopetGaReady?: boolean;
    __ecopetGaLastPage?: string;
    __ecopetGaLastError?: string;
  }
}

export {};
