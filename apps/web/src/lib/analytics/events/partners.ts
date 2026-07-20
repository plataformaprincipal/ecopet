import { defineEvent } from "./definitions";

export const PartnerEvents = {
  SIGNUP: defineEvent({
    event_name: "partner_signup",
    category: "partners",
    action: "signup",
    module: "partners",
  }),
  APPROVED: defineEvent({
    event_name: "partner_approved",
    category: "partners",
    action: "approved",
    module: "partners",
  }),
  REJECTED: defineEvent({
    event_name: "partner_rejected",
    category: "partners",
    action: "rejected",
    module: "partners",
  }),
  PROFILE_UPDATE: defineEvent({
    event_name: "partner_profile_update",
    category: "partners",
    action: "profile_update",
    module: "partners",
  }),
  PRODUCT_CREATE: defineEvent({
    event_name: "partner_product_create",
    category: "partners",
    action: "product_create",
    module: "partners",
  }),
  PRODUCT_EDIT: defineEvent({
    event_name: "partner_product_edit",
    category: "partners",
    action: "product_edit",
    module: "partners",
  }),
  PRODUCT_DELETE: defineEvent({
    event_name: "partner_product_delete",
    category: "partners",
    action: "product_delete",
    module: "partners",
  }),
  SERVICE_CREATE: defineEvent({
    event_name: "partner_service_create",
    category: "partners",
    action: "service_create",
    module: "partners",
  }),
  SERVICE_EDIT: defineEvent({
    event_name: "partner_service_edit",
    category: "partners",
    action: "service_edit",
    module: "partners",
  }),
  SERVICE_DELETE: defineEvent({
    event_name: "partner_service_delete",
    category: "partners",
    action: "service_delete",
    module: "partners",
  }),
} as const;
