# Google Tag Manager — Health & Diagnóstico

## Health (`GET /api/admin/gtm/health`)

Checks reais (código + DB), **não** simulação de tags:

| Check | Significado |
|-------|-------------|
| `GTM_ID_PRESENT` | Env presente |
| `GTM_ID_FORMAT_VALID` | Formato `GTM-XXXX` |
| `GTM_FRONTEND_MODULE_AVAILABLE` | Módulo `lib/gtm` |
| `DATA_LAYER_CONTRACT_AVAILABLE` | Contrato / version |
| `CONSENT_MODULE_AVAILABLE` | Consent Mode |
| `EVENT_CATALOG_AVAILABLE` | Catálogo código |
| `DATABASE_AVAILABLE` | `SELECT 1` |
| `DEDUPLICATION_AVAILABLE` | Tabela dedupe |
| `ADMIN_CONFIGURATION_AVAILABLE` | Ops state / flags |
| `COLLECTION_ENABLED` | Coleta não pausada |

Estados: `healthy` | `degraded` | `unhealthy` | `not_configured`.

## O que health **não** prova

- Container publicado no Google
- Tags disparando
- Hits no GA4

Isso exige Preview / DebugView / relatórios GA4.

## Diagnóstico

`GET /api/admin/gtm/diagnostics` — warnings/errors/recommendations sanitizados, sem stack trace público.
