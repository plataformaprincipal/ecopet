# Operações — IA EcoPet

## Painéis

- `/admin/ai` — Dashboard Executivo + plataforma
- `/admin/ai/executive` — KPIs e parecer de produção
- `/admin/ai/enterprise` — FC, security, tools
- `/admin/ai/foundation` — health/smoke
- `/admin/ai/costs` — custos legado
- `/admin/ai/logs` — logs

## Rotinas

1. Verificar health (latência + status)
2. Revisar alertas de custo (80%/100% budget)
3. Revisar `AISecurityEvent` (injection/exfil)
4. Revisar falhas `AIUsage.success=false`
5. Conferir `AIToolExecution` (latência tools)

## Env relevantes

`OPENAI_API_KEY`, `OPENAI_PROJECT_ID`, `OPENAI_MODEL`, `OPENAI_TOOLS_MODEL`, `OPENAI_FALLBACK_MODEL`, `AI_DAILY_BUDGET_USD`, `AI_MONTHLY_BUDGET_USD`, `AI_TELEMETRY_DEBUG`
