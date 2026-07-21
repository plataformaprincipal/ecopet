# Erros

- Backend: `captureError(error, context)` → classifica + fingerprint + log
- Frontend: Error Boundary / `global-error` → `POST /api/telemetry/client-error`
- Categorias: validation, authentication, authorization, not_found, conflict, rate_limit, external_integration, database, timeout, network, business_rule, security, internal, unknown

Respostas 500 ao cliente: mensagem genérica + `correlationId` (sem stack).
