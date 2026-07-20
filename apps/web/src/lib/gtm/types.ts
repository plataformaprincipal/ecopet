export type GtmEnvironment = "development" | "preview" | "production" | "test" | "unknown";

export type GtmDataLayerObject = Record<string, unknown> & {
  event?: string;
};

export type GtmSanitizedStatus = {
  configured: boolean;
  enabled: boolean;
  containerIdMasked: string | null;
  environment: GtmEnvironment;
  loadContainer: boolean;
  debug: boolean;
  status: "READY" | "DISABLED" | "DEV_ONLY" | "MISSING" | "INVALID_ID";
  sanitizedMessage: string;
  antiDuplicationNote: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    google_tag_manager?: Record<string, unknown>;
    __ecopetGtmReady?: boolean;
    __ecopetGtmLastError?: string;
    __ecopetGtmLastEvent?: string;
  }
}

export {};
