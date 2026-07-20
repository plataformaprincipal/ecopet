# Monitoring — Abstrações

`lib/ai/enterprise/monitoring.ts`

| Backend | Status |
|---------|--------|
| Console sink | Ativo (debug via `AI_TELEMETRY_DEBUG=1`) |
| Sentry | Interface pronta — não instalado |
| OpenTelemetry | Interface pronta — não instalado |
| Prometheus / Grafana | Interface pronta — não instalado |

## Métricas emitidas (stream)

- `assistant.stream.latency_ms`
- `assistant.stream.tools`
- `assistant.stream.error`

Trocar sink: `setTelemetrySink(customSink)`.
