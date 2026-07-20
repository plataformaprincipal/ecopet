# Google Tag Manager — EcoPet

Complementa o GA4 existente. **Não** substitui o `GoogleAnalyticsProvider`.

## Variáveis

| Var | Uso |
|-----|-----|
| `NEXT_PUBLIC_GTM_ID` | Container `GTM-XXXX` (obrigatório para carregar) |
| `NEXT_PUBLIC_GTM_ENABLED` | Kill-switch (`false` desliga) |
| `NEXT_PUBLIC_GTM_ENABLE_DEV` | Libera em development |
| `NEXT_PUBLIC_GTM_ENABLE_PREVIEW` | Libera em preview Vercel |
| `NEXT_PUBLIC_GTM_DEBUG` | Logs |

## Arquitetura

- `lib/gtm/*` — config, dataLayer, container, consent bridge, events, health
- Provider: `providers/google-tag-manager-provider.tsx` (`next/script` afterInteractive)
- Admin (Centro de Governança): `/admin/integracoes/google-tag-manager`
- Detalhes do hub: `docs/gtm-governance.md`

## Anti-duplicação

1. GA4 continua enviando via **gtag** (`send_to` Measurement ID).
2. GTM recebe espelho **namespaced**: `ecopet_ga_event`, `ecopet_page_view`, etc.
3. No container GTM: **não** ative tags GA4 de `page_view` / eventos nativos se o EcoPet já envia.

## Data Layer (Prompt 3)

Pipeline tipado: `lib/gtm/pipeline.ts` (validate → sanitize → consent → dedupe → push).  
Catálogo GTM manual: `docs/integrations/google-tag-manager-events.md`.

## Preview

1. Defina `NEXT_PUBLIC_GTM_ID` + flag de ambiente.
2. Abra GTM Preview e conecte a URL.
3. Valide `dataLayer` com eventos `ecopet_*`.
4. Métricas: `window.__ecopetGtmMetrics`.

## Consent Mode v2

Defaults e updates vêm do módulo analytics; GTM espelha via `ecopet_consent_update`.
