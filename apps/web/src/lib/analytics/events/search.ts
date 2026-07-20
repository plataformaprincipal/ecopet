import { defineEvent } from "./definitions";

export const SearchEvents = {
  SEARCH: defineEvent({
    event_name: "search",
    category: "search",
    action: "search",
    module: "search",
  }),
  NO_RESULTS: defineEvent({
    event_name: "search_no_results",
    category: "search",
    action: "no_results",
    module: "search",
  }),
  FILTER: defineEvent({
    event_name: "search_filter",
    category: "search",
    action: "filter",
    module: "search",
  }),
  CATEGORY: defineEvent({
    event_name: "search_category",
    category: "search",
    action: "category",
    module: "search",
  }),
  SORT: defineEvent({
    event_name: "search_sort",
    category: "search",
    action: "sort",
    module: "search",
  }),
} as const;
