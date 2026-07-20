# Google Tag Manager — Produção

## Painéis

| Rota | Função |
|------|--------|
| `/admin/producao` | Readiness geral (agora inclui checks área **GTM**) |
| `/admin/producao/google-tag-manager` | **Status Geral GTM** + Segurança/LGPD/Performance/SEO/Analytics/Health/Diagnóstico/Checklist/Logs/Versões |
| `/admin/integracoes/google-tag-manager` | Governança (Data Layer, inventário, backend ops) |
| `/admin/integracoes/google-analytics` | GA4 ops |

## Código

- `lib/admin/production/gtm-production-audit.ts`
- Agregado em `getProductionReadinessReport()`
- APIs existentes: `/api/admin/gtm/*`, `/api/admin/production/status`

## Go-live (código)

- Container ID só via `NEXT_PUBLIC_GTM_ID`
- Consent Mode v2 default denied
- Sanitização GA + GTM
- Dedup server + client
- Estratégia B (sem tags GA4 duplicadas no GTM)
- CSP com hosts GTM/GA
- RBAC ADMIN nas APIs

## Go-live (manual — obrigatório)

Ver [runbook de validação manual](../runbooks/google-tag-manager-manual-validation.md).

Itens **MANUAL** no painel:

1. GTM Preview
2. Tag Assistant
3. GA4 DebugView
4. Purchase único após reload
5. Lighthouse staging

## Documentação relacionada

- Arquitetura backend: `google-tag-manager-backend.md`
- Eventos / Data Layer: `google-tag-manager-events.md`
- Health: `google-tag-manager-health.md`
- Dedup: `google-tag-manager-deduplication.md`
- Segurança: `google-tag-manager-security.md`
- Rollback: `../runbooks/google-tag-manager-rollback.md`
- Deploy: `../deploy/launch-checklist.md`
