/**
 * Superfícies já instrumentadas no código (fonte real — não inventar volumes).
 * Usado pelo Centro de Governança para cobertura.
 */
export type InstrumentedSurface = {
  module: string;
  event_name: string;
  surface: string;
  confirmed_after_success: boolean;
};

export const INSTRUMENTED_SURFACES: InstrumentedSurface[] = [
  { module: "auth", event_name: "login", surface: "login-form", confirmed_after_success: true },
  {
    module: "auth",
    event_name: "auth_login_error",
    surface: "login-form",
    confirmed_after_success: true,
  },
  {
    module: "auth",
    event_name: "sign_up",
    surface: "client-register-form",
    confirmed_after_success: true,
  },
  {
    module: "profile",
    event_name: "profile_client_create",
    surface: "client-register-form",
    confirmed_after_success: true,
  },
  {
    module: "marketplace",
    event_name: "add_to_cart",
    surface: "marketplace-store",
    confirmed_after_success: true,
  },
  {
    module: "marketplace",
    event_name: "remove_from_cart",
    surface: "marketplace-store",
    confirmed_after_success: true,
  },
  {
    module: "marketplace",
    event_name: "mp_cart_qty_update",
    surface: "marketplace-store",
    confirmed_after_success: true,
  },
  {
    module: "orders",
    event_name: "begin_checkout",
    surface: "checkout-panel",
    confirmed_after_success: false,
  },
  {
    module: "orders",
    event_name: "purchase",
    surface: "checkout-panel",
    confirmed_after_success: true,
  },
  {
    module: "orders",
    event_name: "order_complete",
    surface: "checkout-panel",
    confirmed_after_success: true,
  },
  {
    module: "payments",
    event_name: "payment_start",
    surface: "checkout-panel",
    confirmed_after_success: true,
  },
  {
    module: "payments",
    event_name: "payment_approved",
    surface: "checkout-panel",
    confirmed_after_success: true,
  },
  {
    module: "payments",
    event_name: "payment_denied",
    surface: "checkout-panel",
    confirmed_after_success: true,
  },
  {
    module: "pets",
    event_name: "pet_add",
    surface: "client-pets-panel",
    confirmed_after_success: true,
  },
  {
    module: "appointments",
    event_name: "agenda_event_create",
    surface: "appointment-booking-form",
    confirmed_after_success: true,
  },
  {
    module: "services",
    event_name: "service_book",
    surface: "appointment-booking-form",
    confirmed_after_success: true,
  },
  {
    module: "social",
    event_name: "social_like",
    surface: "like-button",
    confirmed_after_success: true,
  },
  {
    module: "admin",
    event_name: "admin_bi_open",
    surface: "admin-bi-panel",
    confirmed_after_success: true,
  },
  {
    module: "admin",
    event_name: "admin_analytics_open",
    surface: "admin-bi-panel",
    confirmed_after_success: true,
  },
  {
    module: "shared",
    event_name: "page_view",
    surface: "google-analytics-provider",
    confirmed_after_success: true,
  },
];

export function getInstrumentationCoverage(catalogEventNames: string[]) {
  const instrumented = new Set(INSTRUMENTED_SURFACES.map((s) => s.event_name));
  const implemented = INSTRUMENTED_SURFACES;
  const notInstrumented = catalogEventNames
    .filter((n) => !instrumented.has(n))
    .slice(0, 80);
  return {
    implementedCount: implemented.length,
    catalogCount: catalogEventNames.length,
    coveragePct:
      catalogEventNames.length === 0
        ? 0
        : Math.round((implemented.length / catalogEventNames.length) * 1000) / 10,
    implemented,
    notInstrumentedSample: notInstrumented,
  };
}
