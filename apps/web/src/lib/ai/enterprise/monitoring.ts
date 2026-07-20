/**
 * Abstrações de monitoramento futuro.
 * Não instala Sentry / OpenTelemetry / Prometheus / Grafana.
 */

export type TelemetryBackend = "console" | "sentry" | "otel" | "prometheus" | "grafana";

export type TelemetryEvent = {
  name: string;
  kind: "metric" | "trace" | "log" | "error";
  value?: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: string;
};

export interface TelemetrySink {
  readonly backend: TelemetryBackend;
  emit(event: TelemetryEvent): void | Promise<void>;
}

class ConsoleTelemetrySink implements TelemetrySink {
  readonly backend = "console" as const;
  emit(event: TelemetryEvent): void {
    if (process.env.AI_TELEMETRY_DEBUG === "1") {
      console.info("[ai-telemetry]", event.name, event);
    }
  }
}

let sink: TelemetrySink = new ConsoleTelemetrySink();

export function getTelemetrySink(): TelemetrySink {
  return sink;
}

/** Troca futura: Sentry / OTel / Prometheus sem alterar callers. */
export function setTelemetrySink(next: TelemetrySink): void {
  sink = next;
}

export function trackAiMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
): void {
  void sink.emit({
    name,
    kind: "metric",
    value,
    tags,
    timestamp: new Date().toISOString(),
  });
}

export function trackAiError(
  name: string,
  tags?: Record<string, string>
): void {
  void sink.emit({
    name,
    kind: "error",
    tags,
    timestamp: new Date().toISOString(),
  });
}

export const MONITORING_INTEGRATIONS_READY = {
  sentry: false,
  openTelemetry: false,
  prometheus: false,
  grafana: false,
  abstraction: true,
} as const;
