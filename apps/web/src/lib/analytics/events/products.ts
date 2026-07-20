import { defineEvent } from "./definitions";

/** Alias de marketplace focado em produto (compat catalog). */
export const ProductEvents = {
  VIEW: defineEvent({
    event_name: "view_item",
    category: "products",
    action: "view",
    module: "products",
  }),
  SELECT: defineEvent({
    event_name: "select_content",
    category: "products",
    action: "select",
    module: "products",
  }),
  LEAD: defineEvent({
    event_name: "generate_lead",
    category: "products",
    action: "lead",
    module: "products",
  }),
} as const;
