# Analytics Backend Ops (GA4)

Camada **server-side** de operação da integração Google Analytics — não duplica o warehouse do GA4.

## Escopo

- Estado interno, health, diagnostics, cache, fila (`JobQueue`), auditoria e APIs ADMIN.
- Tracking client + catálogo de eventos + BI: ver docs dos prompts anteriores.

## Módulo

`apps/web/src/lib/analytics/server/`

| Peça | Papel |
|------|--------|
| `AnalyticsServerService` | Facade única para APIs |
| `repository` | `AnalyticsOpsState` / `AnalyticsOpsError` |
| `health` / `diagnostics` | Liveness, readiness, diagnóstico sanitizado |
| `cache` | Cache em memória (TTL configurável) |
| `queue` | Enfileira via `JobQueue` |
| `security` | RBAC ADMIN + sanitização |
| `validator` | Flags de config |
| `webhooks` | Stub abstrato (sem inbound GA) |

Compat Prompt 1: `server-compat.ts` → `getGoogleAnalyticsAdminDiagnostics()`.

## Prisma

- `AnalyticsOpsState` — flags, health, snapshot sanitizado
- `AnalyticsOpsError` — erros internos (sem PII / sem Measurement ID)

Migration: `packages/database/prisma/migrations/20260719210000_analytics_ops_state/`

## APIs (ADMIN + rate limit + audit)

| Método | Path |
|--------|------|
| GET | `/api/admin/analytics/status` |
| GET | `/api/admin/analytics/health` |
| GET | `/api/admin/analytics/config` |
| PATCH | `/api/admin/analytics/config` |
| GET | `/api/admin/analytics/debug` |
| GET | `/api/admin/analytics/events` |
| GET | `/api/admin/analytics/realtime` |
| GET | `/api/admin/analytics/metrics` |
| GET | `/api/admin/analytics/diagnostics` |
| POST | `/api/admin/analytics/test` |
| POST | `/api/admin/analytics/debug-event` |
| POST | `/api/admin/analytics/reprocess` |
| DELETE | `/api/admin/analytics/cache` |

Diagnóstico legado enriquecido: `GET /api/admin/integrations/google-analytics/diagnostics`

## Jobs

- `ANALYTICS_HEALTH_CHECK`
- `ANALYTICS_DIAGNOSTICS_REFRESH`

## Admin UI

`/admin/integracoes/google-analytics` — seção **Backend Ops**.

## Segurança

Nunca expor Measurement ID completo, service account, tokens, PII. Somente `UserRole.ADMIN`.
