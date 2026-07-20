import { defineEvent } from "./definitions";

export const SharedEvents = {
  CONSENT_UPDATE: defineEvent({
    event_name: "consent_update",
    category: "shared",
    action: "consent_update",
    module: "shared",
  }),
  SELECT_CONTENT: defineEvent({
    event_name: "select_content",
    category: "shared",
    action: "select_content",
    module: "shared",
  }),
  SHARE: defineEvent({
    event_name: "share",
    category: "shared",
    action: "share",
    module: "shared",
  }),
  PAGE_ENGAGE: defineEvent({
    event_name: "page_engage",
    category: "shared",
    action: "engage",
    module: "shared",
  }),
} as const;
