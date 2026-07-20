# Google Tag Manager — Catálogo e configuração manual

## Estratégia (EcoPet)

**Estratégia B (oficial neste repositório):**

| Destino | Responsável |
|---------|-------------|
| Hits GA4 | `gtag` via `analyticsService` / dispatcher (`send_to` Measurement ID) |
| Data Layer / tags extras | GTM — eventos **namespaced** `ecopet_*` (espelho) |

**Não** publique no container tags GA4 de `page_view` / eventos nativos que já saem pelo EcoPet gtag — isso duplica conversões.

Contrato Data Layer: `event_version: 1` (`lib/gtm/contract.ts`).

## Variáveis Data Layer (criar no GTM)

| Nome sugerido | Tipo | Data Layer Variable |
|---------------|------|---------------------|
| DLV - ga_event | Data Layer Variable | `ga_event` |
| DLV - module | Data Layer Variable | `module` |
| DLV - page_path | Data Layer Variable | `page_path` |
| DLV - event_id | Data Layer Variable | `event_id` |
| DLV - consent_state | Data Layer Variable | `consent_state` |
| DLV - transaction_id | Data Layer Variable | `transaction_id` |
| DLV - value | Data Layer Variable | `value` |
| DLV - currency | Data Layer Variable | `currency` |
| DLV - ecommerce_action | Data Layer Variable | `ecommerce_action` |

## Triggers (Custom Event)

| Trigger | Event name | Uso |
|---------|------------|-----|
| CE - ecopet_page_view | `ecopet_page_view` | SPA page mirror |
| CE - ecopet_ga_event | `ecopet_ga_event` | Espelho GA4 |
| CE - ecopet_ecommerce | `ecopet_ecommerce` | Funil ecommerce estruturado |
| CE - ecopet_consent_update | `ecopet_consent_update` | Consent Mode update |

## Tags

| Tag | Tipo | Trigger | Consentimento | Nota |
|-----|------|---------|---------------|------|
| GA4 Config | **NÃO usar** se EcoPet gtag ativo | — | — | Evita duplicação |
| Ads / Remarketing | Google Ads | CE - ecopet_* (seletivo) | ad_storage | Opcional |
| Custom HTML | Revisar TI | CE específico | analytics_storage | Sem PII |

## Matriz de eventos (principais)

| Evento GA4 | Origem real | Momento | Data Layer | GTM | GA4 direto | Dedup |
|------------|-------------|---------|------------|-----|------------|-------|
| page_view | App Router provider | SPA path change | `ecopet_page_view` | mirror | gtag | path 1.5s |
| login | login-form | pós-auth OK | `ecopet_ga_event` | mirror | gtag | curto |
| sign_up | register-form | pós-create OK | mirror | mirror | gtag | curto |
| add_to_cart | marketplace-store | ação usuário | mirror + `ecopet_ecommerce` | sim | gtag | curto |
| begin_checkout | checkout-panel | submit checkout | mirror | mirror | gtag | curto |
| purchase | checkout MP onPaid | status APPROVED | mirror | mirror | gtag | session tx id |
| social_like | like-button | pós-like OK | mirror | mirror | gtag | curto |
| pet_add | pets-panel | pós-create | mirror | mirror | gtag | curto |
| agenda_event_create | booking-form | pós-create | mirror | mirror | gtag | curto |

## Consent Mode v2

Defaults denied (analytics) antes das tags. Banner EcoPet atualiza gtag + `ecopet_consent_update`.

## Preview / DebugView

1. GTM Preview → URL do app com GTM habilitado  
2. Console: `dataLayer` / `window.__ecopetGtmMetrics`  
3. GA4 DebugView com `NEXT_PUBLIC_GA_DEBUG=1`  

## Rollback

Desligar: `NEXT_PUBLIC_GTM_ENABLED=false` (mantém GA4 gtag).  
Kill GA: `NEXT_PUBLIC_GA_ENABLED=false`.
