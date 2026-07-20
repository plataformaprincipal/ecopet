export { getGtmBackendStatus, runGtmBackendHealth, runGtmBackendDiagnostics } from "./status-service";
export { getGtmOpsConfig, patchGtmOpsConfig } from "./config-service";
export { getGtmEventCatalog } from "./catalog-service";
export {
  claimTransactionalEvent,
  getDedupStats,
  buildDeduplicationKey,
} from "./deduplication-service";
export { withGtmAdminRoute } from "./http";
export {
  GTM_CONTRACT_VERSION,
  TRANSACTIONAL_EVENTS,
  isTransactionalEventName,
  type GtmOpsConfigFlags,
} from "./types";
