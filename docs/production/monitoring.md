# Monitoramento

- Uptime: `https://<domínio>/api/health/live`
- Ready: `/api/health/ready`
- Admin: `/admin/observability`
- Logs: Better Stack Live tail (`environment`, `correlationId`)
- Alertas: configurar manualmente (docs/observability/alerts.md)

Tracing OTEL: só com `OBS_FLAG_TRACING` + endpoint — não declarar ativo sem evidência.
