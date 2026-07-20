# Otimização de Custos

## Controles

- Modelos via Strategy (`chat` / `tools` / `fallback`)
- FC: máx. 2 rounds · 3 tools
- Intent router reduz tools desnecessárias
- Truncate de contexto/token window
- Cache catálogo (30s) em `domain-reads`
- Orçamentos diário/mensal com alertas

## Painéis

`/admin/ai/executive` e `/admin/ai/enterprise` — custo diário/mensal, por módulo, por tool, top users.

## Env

`AI_DAILY_BUDGET_USD` (default 25), `AI_MONTHLY_BUDGET_USD` (default 500).
