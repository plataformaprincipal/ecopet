# Production checklist — Observabilidade

- [ ] BETTER_STACK_SOURCE_TOKEN na Vercel (server only)
- [ ] BETTER_STACK_HOST com https
- [ ] BETTER_STACK_ENVIRONMENT=production
- [ ] Evento de teste no Live tail
- [ ] /api/health/live no Uptime
- [ ] Alertas manuais configurados
- [ ] Sem SENTRY_DSN ativo sem SDK
- [ ] Sem token em NEXT_PUBLIC_*
- [ ] Redaction validada (teste com fake secret)
