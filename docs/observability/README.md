# Observabilidade EcoPet — Better Stack

## Decisão

| Antes | Depois |
|---|---|
| Sentry stub (sem SDK) | **Removido como ACTIVE** — deprecado |
| LOGTAIL env placeholder | Unificado em `BETTER_STACK_*` |
| Console JSON disperso | Logger central + transporte `@logtail/node` |

## Variáveis (servidor)

```
BETTER_STACK_SOURCE_TOKEN=   # segredo
BETTER_STACK_HOST=           # https://in.logs.betterstack.com (ou host da Source)
BETTER_STACK_SOURCE_ID=
BETTER_STACK_REGION=
BETTER_STACK_ENVIRONMENT=development|test|preview|production
```

Opcional OTEL (traces — **só se configurado**):

```
OTEL_EXPORTER_OTLP_ENDPOINT=https://$INGESTING_HOST
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer $SOURCE_TOKEN
OTEL_SERVICE_NAME=ecopet-web
```

**Nunca** `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN`.

## Arquitetura

- Browser erros → `POST /api/telemetry/client-error` → logger → Better Stack
- Server → `logStructured` / `captureError` → console + `@logtail/node`
- Health público: `/api/health/live`, `/api/health/ready`
- Admin: `/admin/observability`

## Limitações vs Sentry

| Recurso | Status |
|---|---|
| Logs estruturados | Funcional |
| Erros backend/frontend | Funcional (via API) |
| Session Replay | **Não suportado / não implementado** |
| Source maps upload Sentry | N/A |
| Traces OTEL | Interface — ativo só com OTEL_* |
| Alertas/dashboards | Manuais no painel Better Stack |

## Documentação

- [architecture.md](./architecture.md)
- [better-stack-setup.md](./better-stack-setup.md)
- [environments.md](./environments.md)
- [logging.md](./logging.md)
- [errors.md](./errors.md)
- [frontend-errors.md](./frontend-errors.md)
- [backend-errors.md](./backend-errors.md)
- [tracing.md](./tracing.md)
- [metrics.md](./metrics.md)
- [correlation.md](./correlation.md)
- [redaction.md](./redaction.md)
- [security.md](./security.md)
- [privacy.md](./privacy.md)
- [integrations.md](./integrations.md)
- [webhooks.md](./webhooks.md)
- [jobs.md](./jobs.md)
- [health.md](./health.md)
- [alerts.md](./alerts.md)
- [dashboards.md](./dashboards.md)
- [admin.md](./admin.md)
- [testing.md](./testing.md)
- [troubleshooting.md](./troubleshooting.md)
- [incident-response.md](./incident-response.md)
- [production-checklist.md](./production-checklist.md)
- [sentry-migration.md](./sentry-migration.md)

## Testes

```bash
npm run test:observability -w @ecopet/web
```
