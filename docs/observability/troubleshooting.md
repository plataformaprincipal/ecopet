# Troubleshooting

| Sintoma | Ação |
|---|---|
| Sem eventos no Better Stack | Conferir `BETTER_STACK_SOURCE_TOKEN` + `BETTER_STACK_HOST`; Live tail; admin test event |
| Token no client | Remover qualquer `NEXT_PUBLIC_BETTER_*` |
| App lenta | Transporte é fail-open/async; verificar volume/sampling |
| Tracing “ligado” mas sem spans | Exige OTEL endpoint + flag; logs ≠ traces |
| Cookies de login sumiram | `withApiTelemetry` muta headers no response original |
