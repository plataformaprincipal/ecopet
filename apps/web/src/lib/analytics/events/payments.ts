import { defineEvent } from "./definitions";

export const PaymentEvents = {
  PAYMENT_START: defineEvent({
    event_name: "payment_start",
    category: "payments",
    action: "start",
    module: "payments",
  }),
  PAYMENT_APPROVED: defineEvent({
    event_name: "payment_approved",
    category: "payments",
    action: "approved",
    module: "payments",
  }),
  PAYMENT_DENIED: defineEvent({
    event_name: "payment_denied",
    category: "payments",
    action: "denied",
    module: "payments",
  }),
  PAYMENT_CANCEL: defineEvent({
    event_name: "payment_cancel",
    category: "payments",
    action: "cancel",
    module: "payments",
  }),
  PAYMENT_ERROR: defineEvent({
    event_name: "payment_error",
    category: "payments",
    action: "error",
    module: "payments",
  }),
} as const;
