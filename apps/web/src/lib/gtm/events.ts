/**
 * Eventos namespaced para o GTM Preview / Custom Triggers.
 * NÃO usar page_view / purchase nativos aqui — isso evitará duplicar GA4
 * quando o Measurement Protocol/gtag EcoPet já envia.
 */
export const GtmEvents = {
  PAGE_VIEW: "ecopet_page_view",
  GA_MIRROR: "ecopet_ga_event",
  ECOMMERCE: "ecopet_ecommerce",
  USER: "ecopet_user",
  CONSENT: "ecopet_consent_update",
  LOGIN: "ecopet_login",
  SIGN_UP: "ecopet_sign_up",
  ADD_TO_CART: "ecopet_add_to_cart",
  BEGIN_CHECKOUT: "ecopet_begin_checkout",
  PURCHASE: "ecopet_purchase",
  SEARCH: "ecopet_search",
  SOCIAL: "ecopet_social",
  PET: "ecopet_pet",
  APPOINTMENT: "ecopet_appointment",
  AI: "ecopet_ai",
  ADMIN: "ecopet_admin",
} as const;

export type GtmEventName = (typeof GtmEvents)[keyof typeof GtmEvents];
