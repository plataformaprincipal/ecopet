import { defineEvent } from "./definitions";

export const AiEvents = {
  ASSISTANT_OPEN: defineEvent({
    event_name: "ai_assistant_open",
    category: "ai",
    action: "open",
    module: "ai",
  }),
  QUESTION: defineEvent({
    event_name: "ai_question_sent",
    category: "ai",
    action: "question",
    module: "ai",
  }),
  RESPONSE: defineEvent({
    event_name: "ai_response_received",
    category: "ai",
    action: "response",
    module: "ai",
  }),
  TOOL_USED: defineEvent({
    event_name: "ai_tool_used",
    category: "ai",
    action: "tool",
    module: "ai",
  }),
  ERROR: defineEvent({
    event_name: "ai_error",
    category: "ai",
    action: "error",
    module: "ai",
  }),
  LATENCY: defineEvent({
    event_name: "ai_response_time",
    category: "ai",
    action: "latency",
    module: "ai",
  }),
  CATALOG_VIEW: defineEvent({
    event_name: "ai_catalog_view",
    category: "ai",
    action: "view",
    module: "ai",
  }),
  PRODUCT_VIEW: defineEvent({
    event_name: "ai_product_view",
    category: "ai",
    action: "view",
    module: "ai",
  }),
  ADD_TO_CART: defineEvent({
    event_name: "ai_add_to_cart",
    category: "ai",
    action: "add_to_cart",
    module: "ai",
  }),
  CHECKOUT_STARTED: defineEvent({
    event_name: "ai_checkout_started",
    category: "ai",
    action: "checkout",
    module: "ai",
  }),
  PAYMENT_APPROVED: defineEvent({
    event_name: "ai_payment_approved",
    category: "ai",
    action: "payment",
    module: "ai",
  }),
  ENTITLEMENT_CREATED: defineEvent({
    event_name: "ai_entitlement_created",
    category: "ai",
    action: "entitlement",
    module: "ai",
  }),
  EXECUTION_STARTED: defineEvent({
    event_name: "ai_execution_started",
    category: "ai",
    action: "execution",
    module: "ai",
  }),
  EXECUTION_COMPLETED: defineEvent({
    event_name: "ai_execution_completed",
    category: "ai",
    action: "execution",
    module: "ai",
  }),
  REPORT_DOWNLOADED: defineEvent({
    event_name: "ai_report_downloaded",
    category: "ai",
    action: "report",
    module: "ai",
  }),
  REPURCHASE: defineEvent({
    event_name: "ai_repurchase",
    category: "ai",
    action: "repurchase",
    module: "ai",
  }),
} as const;