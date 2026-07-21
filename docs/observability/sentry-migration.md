# Migração Sentry → Better Stack

## Evidência

- Nenhum `@sentry/nextjs` instalado
- `captureError` era stub com `console.error`
- Providers marcavam Sentry ACTIVE só por DSN env (falso positivo) — **corrigido**

## Ações

- Sentry permanece listado como **NOT_CONFIGURED / deprecado**
- Remover `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` dos deploys quando possível
- Usar Better Stack para logs/erros
- Session Replay: não migrado (limitação Better Stack / escopo)
