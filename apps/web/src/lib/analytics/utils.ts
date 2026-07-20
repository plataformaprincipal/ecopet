/** Reexports de conveniência (padrão EcoPet). */
export {
  getGaMeasurementId,
  isGaConfigured,
  shouldSendToGoogle,
  maskMeasurementId,
  isAnalyticsExcludedPath,
} from "./config";
export { sanitizeEventParams, sanitizePath, isSafeEventName } from "./sanitize";
export { AnalyticsEvents, trackEvent } from "./events";
export { trackPageView } from "./pageviews";
export {
  grantAnalyticsConsent,
  revokeAnalyticsConsent,
  hasAnalyticsConsent,
  updateConsent,
} from "./consent";
