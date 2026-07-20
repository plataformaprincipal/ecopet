# Arquitetura Analytics EcoPet

## Camadas (não reimplementar)

| Prompt | Escopo | Path principal |
|--------|--------|----------------|
| 1 | GA4 client + Consent Mode | `lib/analytics/*`, provider |
| 2 | BI Admin | `lib/admin/bi/*`, `/admin/bi` |
| 3 | Catálogo de eventos | `lib/analytics/events/*` |
| 4 | Backend Ops | `lib/analytics/server/*`, `/api/admin/analytics/*` |
| 5 | Produção / LGPD UI / readiness | ConsentBanner, `/admin/producao` |
| 6 | Google Tag Manager | `lib/gtm/*`, `/admin/integracoes/google-tag-manager` |

## Fluxo de eventos

```
UI / store → factory → dispatcher → analyticsService
  → consent check → sanitize → gtag (se sendToGoogle)
```

Server ops **não** espelha warehouse GA4 — só health/config/audit.

## Consent Mode v2

- Defaults: denied
- Persistência: `localStorage` (`ecopet.analytics.consent.v1`)
- Banner: `ConsentBanner`
- CMP futuro: `applyExternalCmpConsent()`

## Admin

- Tracking ops: `/admin/integracoes/google-analytics`
- BI: `/admin/bi/google-analytics`
- Produção: `/admin/producao`
