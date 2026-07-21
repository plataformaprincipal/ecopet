# Erros de frontend

Estratégia A (adotada): browser → endpoint interno → sanitização → rate limit → Better Stack.

- Endpoint: `POST /api/telemetry/client-error`
- Flag: `OBS_FLAG_CLIENT_ERRORS`
- Sem token no browser
- Sem Session Replay
- Payload allowlist + truncagem de stack

Ver `apps/web/src/app/api/telemetry/client-error/route.ts`.
