# EcoPet — Camada de Eventos GA4

Catálogo enterprise em `apps/web/src/lib/analytics/events/`.

## APIs

```ts
import { analyticsService } from "@/lib/analytics/service";
import { AuthEvents, MarketplaceEvents } from "@/lib/analytics/events";

analyticsService.setUser({ userId: user.id, userRole: user.role });
analyticsService.track(AuthEvents.LOGIN, { label: "credentials", params: { method: "credentials" } });
analyticsService.track(MarketplaceEvents.ADD_TO_CART, { value: 49.9, params: { item_id: "…" } });
```

Hooks: `useTrackEvent()`, `useAnalytics().track`.

## Pipeline

1. **Catalog** — definição tipada (`event_name`, `category`, `action`, `module`)
2. **Factory** — enriquecer com `anonymous_id`, `session_id`, `user_role`, `device`, `page`, `timestamp`…
3. **Dispatcher** — consent + `shouldSendToGoogle` + sanitize + `gtag`
4. **Service** — API única da aplicação

## Consentimento

Eventos só saem com `analytics_storage=granted` (Consent Mode v2).

## LGPD

Sanitize remove e-mail, telefone, tokens, cartão, CPF, endereço, notas médicas.

## Instrumentação (v1)

| Fluxo | Evento |
|-------|--------|
| Login OK / erro | `login` / `auth_login_error` |
| Cadastro cliente | `sign_up` + `profile_client_create` |
| Carrinho | `add_to_cart`, `remove_from_cart`, `mp_cart_qty_update` |
| Checkout | `begin_checkout`, `order_complete`, `purchase`, payments |
| Social like | `social_like` |
| Pet create | `pet_add` |
| Agendamento | `agenda_event_create`, `service_book` |
| Admin BI | `admin_bi_open` |

Demais eventos do catálogo estão prontos para wire nos handlers restantes.

## DebugView

1. `NEXT_PUBLIC_GA_MEASUREMENT_ID` + `NEXT_PUBLIC_GA_DEBUG=1`
2. Consent granted (`NEXT_PUBLIC_GA_CONSENT_DEFAULT=granted` ou banner)
3. Produção ou `NEXT_PUBLIC_GA_ENABLE_DEV=1`
4. Abrir GA4 → Admin → DebugView e exercer login/carrinho/checkout
