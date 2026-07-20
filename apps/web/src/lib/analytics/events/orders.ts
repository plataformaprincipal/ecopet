import { defineEvent } from "./definitions";

export const OrderEvents = {
  BEGIN_CHECKOUT: defineEvent({
    event_name: "begin_checkout",
    category: "checkout",
    action: "begin",
    module: "orders",
  }),
  ADDRESS_STEP: defineEvent({
    event_name: "checkout_address",
    category: "checkout",
    action: "address",
    module: "orders",
  }),
  SHIPPING_STEP: defineEvent({
    event_name: "checkout_shipping",
    category: "checkout",
    action: "shipping",
    module: "orders",
  }),
  PAYMENT_START: defineEvent({
    event_name: "checkout_payment_start",
    category: "checkout",
    action: "payment_start",
    module: "orders",
  }),
  PURCHASE: defineEvent({
    event_name: "purchase",
    category: "checkout",
    action: "purchase",
    module: "orders",
  }),
  PAYMENT_DENIED: defineEvent({
    event_name: "checkout_payment_denied",
    category: "checkout",
    action: "payment_denied",
    module: "orders",
  }),
  PAYMENT_CANCEL: defineEvent({
    event_name: "checkout_payment_cancel",
    category: "checkout",
    action: "payment_cancel",
    module: "orders",
  }),
  ORDER_COMPLETE: defineEvent({
    event_name: "order_complete",
    category: "orders",
    action: "complete",
    module: "orders",
  }),
  ORDER_CANCEL: defineEvent({
    event_name: "order_cancel",
    category: "orders",
    action: "cancel",
    module: "orders",
  }),
  ORDER_VIEW: defineEvent({
    event_name: "order_view",
    category: "orders",
    action: "view",
    module: "orders",
  }),
  ORDER_STATUS: defineEvent({
    event_name: "order_status_view",
    category: "orders",
    action: "status",
    module: "orders",
  }),
  ORDER_TRACK: defineEvent({
    event_name: "order_track",
    category: "orders",
    action: "track",
    module: "orders",
  }),
  ORDER_REVIEW: defineEvent({
    event_name: "order_review",
    category: "orders",
    action: "review",
    module: "orders",
  }),
  ORDER_REFUND: defineEvent({
    event_name: "order_refund",
    category: "orders",
    action: "refund",
    module: "orders",
  }),
} as const;
