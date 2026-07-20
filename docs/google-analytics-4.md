# Google Analytics 4 (EcoPet)

Integração enterprise via `apps/web/src/lib/analytics` + `GoogleAnalyticsProvider` no App Router.

## Variável obrigatória

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Nunca hardcode o ID. Placeholders (`G-XXXXXXXX`) são rejeitados.

## Flags opcionais

| Variável | Default | Efeito |
|----------|---------|--------|
| `NEXT_PUBLIC_GA_ENABLED` | on | `false` / `0` / `off` desliga envio |
| `NEXT_PUBLIC_GA_ENABLE_DEV` | off | Permite envio em `development` |
| `NEXT_PUBLIC_GA_ENABLE_PREVIEW` | off | Permite envio em preview Vercel |
| `NEXT_PUBLIC_GA_DEBUG` | off | Logs + `debug_mode` no gtag |
| `NEXT_PUBLIC_GA_CONSENT_DEFAULT` | denied | `granted` libera `analytics_storage` até banner CMP |

## Comportamento

- Script gtag só carrega quando `shouldSendToGoogle()` é true (produção por padrão).
- `send_page_view: false` — page views SPA via `usePathname` + dedupe.
- Rotas excluídas: `/admin`, `/api`, `/gestor`, `/login`, `/register`, `/auth`.
- Consent Mode v2: defaults denied (LGPD). API: `grantAnalyticsConsent` / `revokeAnalyticsConsent`.
- Params sanitizados (sem e-mail, CPF, tokens, etc.).

## Admin

`/admin/integracoes/google-analytics` — status, ID mascarado, health, consent defaults.

API: `GET /api/admin/integrations/google-analytics/diagnostics` (ADMIN only).

## Hooks

```ts
import { useAnalytics } from "@/hooks/use-analytics";
import { useTrackEvent } from "@/hooks/use-track-event";
import { AnalyticsEvents } from "@/lib/analytics";

const { track, grantConsent } = useAnalytics();
track(AnalyticsEvents.LOGIN, { method: "credentials" });
```

## Banco

Sem tabelas Prisma novas — eventos ficam no Google Analytics. EcoPet só expõe diagnóstico sanitizado.

## Produção (checklist)

1. Definir `NEXT_PUBLIC_GA_MEASUREMENT_ID` na Vercel (Production).
2. Confirmar CSP com hosts GA (já em `headers.ts`).
3. Decidir consent: banner CMP **ou** `NEXT_PUBLIC_GA_CONSENT_DEFAULT=granted` (avaliar LGPD).
4. Validar no Realtime do GA4 (navegação pública, não `/admin`).
5. Abrir painel admin e conferir status READY + ID mascarado.
