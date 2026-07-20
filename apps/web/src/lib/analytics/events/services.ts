import { defineEvent } from "./definitions";

export const ServiceEvents = {
  SEARCH: defineEvent({
    event_name: "service_search",
    category: "services",
    action: "search",
    module: "services",
  }),
  BOOK: defineEvent({
    event_name: "service_book",
    category: "services",
    action: "book",
    module: "services",
  }),
  CANCEL: defineEvent({
    event_name: "service_cancel",
    category: "services",
    action: "cancel",
    module: "services",
  }),
  RESCHEDULE: defineEvent({
    event_name: "service_reschedule",
    category: "services",
    action: "reschedule",
    module: "services",
  }),
  COMPLETE: defineEvent({
    event_name: "service_complete",
    category: "services",
    action: "complete",
    module: "services",
  }),
  REVIEW: defineEvent({
    event_name: "service_review",
    category: "services",
    action: "review",
    module: "services",
  }),
} as const;
