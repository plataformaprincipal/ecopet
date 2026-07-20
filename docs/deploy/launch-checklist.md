# Checklist de Lançamento — Produção

## Analytics / GTM

- [ ] Measurement ID em produção (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- [ ] Container GTM em produção (`NEXT_PUBLIC_GTM_ID`)
- [ ] Consent banner funcional (Aceitar / Essenciais / Personalizar)
- [ ] Eventos críticos: login, purchase, page_view
- [ ] GTM Preview aprovado (tags/triggers/variables)
- [ ] DebugView validado em preview
- [ ] Sem duplicação de pageviews em SPA
- [ ] Purchase único após reload (claim server + client)
- [ ] Estratégia B: sem tags GA4 duplicadas no container GTM
- [ ] Painel `/admin/producao/google-tag-manager` revisado

## Segurança / LGPD

- [ ] CSP inclui GTM + GA + Mercado Pago + Maps
- [ ] Cookies sessão/carrinho Secure em HTTPS
- [ ] Sanitização GA/GTM bloqueia PII
- [ ] Rate limit ativo em auth/admin/gtm
- [ ] Secrets só no Vercel (nunca no Git)

## SEO / Performance

- [ ] robots.txt / sitemap.xml
- [ ] OG / Twitter / manifest
- [ ] Lighthouse staging ≥ meta do time
- [ ] Imagens via next/image ou Cloudinary

## Plataforma

- [ ] `db:migrate:deploy` no ambiente
- [ ] `/admin/producao` revisado
- [ ] Integrações necessárias CONFIGURED/ACTIVE
- [ ] Health OK (API + GTM)
- [ ] Diagnostics OK
- [ ] Rollback documentado (`docs/deploy/rollback-checklist.md` + GTM rollback)
- [ ] Monitoramento (`docs/deploy/monitoring-checklist.md`)
- [ ] Validação manual: `docs/runbooks/google-tag-manager-manual-validation.md`

## Validação CI local

```bash
npm run db:generate
npm run type-check -w @ecopet/web
npm run lint -w @ecopet/web
npm run test:analytics -w @ecopet/web
npm run test:gtm -w @ecopet/web
npm run test:production -w @ecopet/web
npm run build -w @ecopet/web
```
