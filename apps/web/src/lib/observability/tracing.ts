/**
 * OpenTelemetry — interface pronta.
 * Tracing funcional SOMENTE com OBS_FLAG_TRACING=true + OTEL_EXPORTER_OTLP_ENDPOINT.
 * Não declarar tracing ativo sem essas variáveis.
 */
import { getBetterStackConfig, isObservabilityFlagEnabled } from "./config";

export function isTracingEnabled(): boolean {
  return isObservabilityFlagEnabled("tracing");
}

export function getTracingStatus() {
  const c = getBetterStackConfig();
  return {
    enabled: isTracingEnabled(),
    endpointConfigured: Boolean(c.otelEndpoint),
    serviceName: c.serviceName,
    environment: c.environment,
    note: isTracingEnabled()
      ? "OTLP endpoint presente — configure exporter no deploy (Vercel/Node)."
      : "Tracing desligado. Defina OTEL_EXPORTER_OTLP_ENDPOINT e OBS_FLAG_TRACING=true.",
  };
}
