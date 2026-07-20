# Health IA

## API

`GET /api/admin/ai/foundation?view=health` — ADMIN + rate limit.

Checks:

- `API_KEY`
- `PROJECT_ID` (opcional)
- `GLOBALLY_ENABLED`
- `CLIENT_SINGLETON`
- `TIMEOUT`
- `RETRY`
- `MODEL_REGISTRY`
- `OPENAI_REACHABLE` (`models.list`)

Estados: `healthy` | `degraded` | `unhealthy` | `not_configured`.

## Smoke test

`POST /api/admin/ai/foundation` — completion mínima (`max_tokens=8`).

## UI

`/admin/ai/foundation` → Health / Testes  
Hooks: `useAIHealth()`.
