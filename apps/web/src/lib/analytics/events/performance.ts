import { defineEvent } from "./definitions";

export const PerformanceEvents = {
  PAGE_LOAD: defineEvent({
    event_name: "perf_page_load",
    category: "performance",
    action: "page_load",
    module: "performance",
  }),
  FIRST_RENDER: defineEvent({
    event_name: "perf_first_render",
    category: "performance",
    action: "first_render",
    module: "performance",
  }),
  API_TIME: defineEvent({
    event_name: "perf_api_time",
    category: "performance",
    action: "api_time",
    module: "performance",
  }),
  PAGE_TIME: defineEvent({
    event_name: "perf_page_time",
    category: "performance",
    action: "page_time",
    module: "performance",
  }),
  CHECKOUT_TIME: defineEvent({
    event_name: "perf_checkout_time",
    category: "performance",
    action: "checkout_time",
    module: "performance",
  }),
} as const;
