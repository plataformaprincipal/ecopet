import { defineEvent } from "./definitions";

export const ErrorEvents = {
  NOT_FOUND: defineEvent({
    event_name: "error_404",
    category: "errors",
    action: "404",
    module: "errors",
  }),
  SERVER: defineEvent({
    event_name: "error_500",
    category: "errors",
    action: "500",
    module: "errors",
  }),
  API: defineEvent({
    event_name: "error_api",
    category: "errors",
    action: "api",
    module: "errors",
  }),
  AUTH: defineEvent({
    event_name: "error_auth",
    category: "errors",
    action: "auth",
    module: "errors",
  }),
  PAYMENT: defineEvent({
    event_name: "error_payment",
    category: "errors",
    action: "payment",
    module: "errors",
  }),
  UPLOAD: defineEvent({
    event_name: "error_upload",
    category: "errors",
    action: "upload",
    module: "errors",
  }),
  ANALYTICS: defineEvent({
    event_name: "error_analytics",
    category: "errors",
    action: "analytics",
    module: "errors",
  }),
  MAPS: defineEvent({
    event_name: "error_maps",
    category: "errors",
    action: "maps",
    module: "errors",
  }),
  AI: defineEvent({
    event_name: "error_ai",
    category: "errors",
    action: "ai",
    module: "errors",
  }),
} as const;
