export {
  getGtmContainerId,
  getGtmSanitizedStatus,
  isGtmConfigured,
  isValidGtmContainerId,
  maskGtmContainerId,
  shouldLoadGtm,
  detectGtmEnvironment,
  isGtmDebugEnabled,
} from "./config";
export {
  ensureDataLayer,
  pushToDataLayer,
  pushEvent,
  pushPage,
  pushEcommerce,
  pushUser,
  pushConsent,
  pushIfGtmEnabled,
} from "./datalayer";
export {
  bootstrapGtmContainer,
  markGtmReady,
  isGtmReady,
  getGtmScriptSrc,
  getGtmNoscriptSrc,
} from "./container";
export { syncGtmConsent } from "./consent";
export { GtmEvents } from "./events";
export { mirrorGaEventToGtm, mirrorGaPageViewToGtm, pushGtmEcommerce } from "./bridge";
export { pushTelemetryEvent } from "./pipeline";
export { getPipelineMetrics } from "./metrics";
export { getInstrumentationCoverage, INSTRUMENTED_SURFACES } from "./coverage";
export { claimTransactionalOnce, shouldDedupeEvent } from "./deduplication";
export { sanitizeSearchTerm, sanitizeDataLayerParams } from "./event-sanitizer";
export { buildEcommerceParams } from "./ecommerce";
export { GTM_EVENT_VERSION } from "./contract";
export { getGtmDebugSnapshot } from "./debug";
export { getGtmHealth } from "./health";
