# Automações EcoPet IA

## Modelo

- Regras declarativas em `lib/ai/operational/automations/registry.ts`
- Execução em `executor.ts` → `AIJob` (`type=AI_AUTOMATION`) + notificação in-app
- Deduplicação por `dedupeKey` (24h)
- Feature flags: `AI_FLAG_AUTOMATIONS`, `AI_FLAG_SMART_NOTIFICATIONS`

## Eventos cobertos (MVP)

- `cart.abandoned`
- `vaccine.due_soon`
- `stock.low`
- `integration.failure`
- `ai.budget_warning`

## Integração

Chame `processAutomationEvent({ event, userId, ... })` a partir de webhooks/jobs de domínio. Não dispara e-mail/push de teste em produção sem preferências.

## Admin

`/admin/ai/operational` — listar regras, jobs e executar teste com `dedupeKey` único.
