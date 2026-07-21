# Tracing (OpenTelemetry)

**Status:** interface pronta; **não funcional** até:

1. `OTEL_EXPORTER_OTLP_ENDPOINT` = `https://$INGESTING_HOST` (docs Better Stack)
2. `OTEL_EXPORTER_OTLP_HEADERS` = `Authorization=Bearer $SOURCE_TOKEN`
3. `OBS_FLAG_TRACING=true`

Correlation IDs e `durationMs` funcionam independentemente de OTEL.

Não afirmar “tracing ativo” sem essas condições.
