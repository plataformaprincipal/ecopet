# Monitoring Plan — Pós-lançamento

## Fontes

| Fonte | Uso | Status |
|-------|-----|--------|
| Vercel Runtime Logs | 5xx, cold start | Preparado |
| Better Stack / Logtail | erros, correlation ID | BLOQUEADO POR CREDENCIAL local |
| `/api/health/live` | uptime externo | Código APROVADO |
| `/api/health/ready` | DB | Código APROVADO |
| Admin observability | snapshot interno | Código presente |

## Thresholds sugeridos (primeira semana)

| Métrica | Alerta |
|---------|--------|
| 5xx rate | > 2% / 5 min |
| Ready failures | > 1 / 5 min |
| Login 429 anormais | spike vs baseline |
| Webhook MP invalid signature | > 5 / hora |
| OpenAI errors | > 10 / 15 min |
| TTFB home | > 2s p95 (ajustar) |

## Período

Monitoramento intensivo 72h pós-Production; Better Stack obrigatório antes de declarar produção plena.
