/**
 * Reexport da API pública de observabilidade (server-safe modules).
 * Transporte Better Stack é importado dinamicamente pelo logger.
 */
export {
  getBetterStackConfig,
  getObservabilityHealthSnapshot,
  isBetterStackConfigured,
  isObservabilityFlagEnabled,
  listObservabilityFlags,
  resolveObservabilityEnvironment,
} from "./config";

export { logStructured, log } from "./logger";
export {
  captureError,
  captureSecurityEvent,
  classifyError,
  errorFingerprint,
} from "./error-capture";
export {
  correlationIdFromHeaders,
  getRequestContext,
  resolveCorrelationId,
  runWithRequestContext,
  runWithRequestContextAsync,
} from "./context";
export {
  redactForObservability,
  hashIdentifier,
  sanitizeErrorMessage,
  newCorrelationId,
} from "./redaction";
export { trackMetric, MetricNames } from "./metrics";
export { withApiTelemetry } from "./with-api-telemetry";
export { withJobTelemetry } from "./with-job-telemetry";
export { withServerActionTelemetry } from "./with-server-action-telemetry";
export {
  observeIntegrationCall,
  observePrismaOperation,
  recordIntegrationEvent,
  recordWebhookTelemetry,
} from "./integrations";
export { getTracingStatus, isTracingEnabled } from "./tracing";
export { getObservabilityProviders } from "./providers";
