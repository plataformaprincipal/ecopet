# Arquitetura de observabilidade

## Fluxo

```
Browser ──► POST /api/telemetry/client-error ──► logger ──► Better Stack
Server (API/Actions/Jobs) ──► logStructured / captureError ──► console + @logtail/node
Uptime monitor ──► GET /api/health/live
```

## Camada central

`apps/web/src/lib/observability/`

| Módulo | Responsabilidade |
|---|---|
| `config.ts` | Env, flags, health snapshot |
| `logger.ts` | Níveis + console + transporte |
| `better-stack-transport.ts` | `@logtail/node` (server-only) |
| `redaction.ts` | PII/secrets |
| `context.ts` | Correlation ID (ALS) |
| `error-capture.ts` | Classificação + fingerprint |
| `metrics.ts` | Métricas como eventos estruturados |
| `integrations.ts` | Telemetria de providers |
| `with-*-telemetry.ts` | Wrappers API / actions / jobs |
| `tracing.ts` | Status OTEL (opt-in) |

## Regras

- Token **somente servidor** (`BETTER_STACK_SOURCE_TOKEN`)
- Nenhum módulo chama Better Stack fora desta camada
- Fallback: Better Stack down → console sanitizado; app não cai
- Session Replay: **não implementado**
