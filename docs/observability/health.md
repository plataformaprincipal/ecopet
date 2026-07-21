# Health checks

| Rota | Acesso | Função |
|---|---|---|
| `/api/health/live` | público | liveness / uptime |
| `/api/health/ready` | público | readiness (DB) |
| `/api/health` | existente | health legado |
| `/api/internal/observability/health` | admin | snapshot + teste |
| `/api/internal/observability/diagnostics` | admin | diagnóstico |

Uptime Better Stack: aponte para `/api/health/live` (não gera pedidos/pagamentos).
