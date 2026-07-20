/** Exports seguros (sem server-only). */
export {
  getGaMeasurementId,
  isValidGaMeasurementId,
  maskMeasurementId,
  detectAnalyticsEnvironment,
  isGaDebugEnabled,
  shouldSendToGoogle,
  isGaConfigured,
  getDefaultConsentSettings,
  getAnalyticsSanitizedStatus,
  isAnalyticsExcludedPath,
  ANALYTICS_EXCLUDED_PATH_PREFIXES,
} from "./config";

export { sanitizeEventParams, sanitizePath, isSafeEventName } from "./sanitize";
export {
  AnalyticsEvents,
  EcoPetEventCatalog,
  AuthEvents,
  MarketplaceEvents,
  OrderEvents,
  PaymentEvents,
  PetEvents,
  SocialEvents,
  ServiceEvents,
  AppointmentEvents,
  PartnerEvents,
  NgoEvents,
  AdminEvents,
  ChatEvents,
  AiEvents,
  ProfileEvents,
  SearchEvents,
  MapsEvents,
  ErrorEvents,
  PerformanceEvents,
  SharedEvents,
  ProductEvents,
  NotificationEvents,
  trackEvent,
  listAllEventDefinitions,
  countCatalogEvents,
} from "./events";
export { analyticsService } from "./service";
export { dispatchAnalyticsEvent } from "./dispatcher";
export { buildAnalyticsEvent } from "./factory";
export { setAnalyticsUser, getClientAnalyticsContext } from "./context";
export type {
  ConsentSettings,
  ConsentState,
  AnalyticsEventParams,
  TrackEventInput,
  PageViewInput,
  AnalyticsSanitizedStatus,
  AnalyticsEnvironment,
} from "./types";
export type { AnalyticsEventDefinition } from "./events/definitions";
