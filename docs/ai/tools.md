# Tool Registry

Registro em `lib/ai/modules/tool-registry.ts`.

## Ferramentas (read-only)

- `consult_products` / `consult_services` / `consult_partners_public`
- `consult_cart` / `consult_orders`
- `consult_pets` / `consult_agenda`
- `consult_profile` / `consult_notifications`
- `consult_partner_summary` / `consult_ngo_summary`
- `consult_social`

## Executor

`executeBusinessTool` → permissão → validação → `domain-reads` (services) → sanitize → audit.

## Services usados

Marketplace `public-query`, cart-service, notifications, petos-overview, partner/ong ai-insights, social search, leituras seguras de pedidos/agenda/perfil.
