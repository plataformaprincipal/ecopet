# Checklist de Monitoramento — Pós-deploy

## T+0 (imediato)

- [ ] Build Vercel verde
- [ ] `/api/health` → OK
- [ ] `/admin/producao` → overall ≠ NOT_READY por FAIL crítico
- [ ] Login ADMIN
- [ ] Integrações hub sem ERROR inesperado

## T+30min

- [ ] Logs Vercel sem spike de 5xx
- [ ] Mercado Pago webhooks (se produção de pagamentos)
- [ ] GA4 Realtime / DebugView (preview com debug)
- [ ] Filas `JobQueue` sem acumulação anômala

## Contínuo

- [ ] Painel Produção (diário em go-live week)
- [ ] Sentry (quando DSN + SDK habilitados)
- [ ] Custo OpenAI / Resend
- [ ] Alertas BI (`/admin/bi/alertas`)

## Links

- Status: `/admin/producao`
- GA Ops: `/admin/integracoes/google-analytics`
- Integrações: `/admin/integracoes`
