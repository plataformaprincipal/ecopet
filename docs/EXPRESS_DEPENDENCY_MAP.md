# Mapa de Dependências Express — Fase 1

**Data:** 2026-08-06  
**Escopo:** inventário apenas (sem remoção da API Express)  
**Proxy:** `apps/web/src/app/api/ecopet/[...path]/route.ts` → `{API_INTERNAL_URL}/api/*`  
**Produção Vercel:** Express **não** é implantado com `apps/web`.

## Comportamento em indisponibilidade (Fase 1)

| Situação | Comportamento |
| -------- | ------------- |
| `API_INTERNAL_URL` ausente em produção/Vercel | Proxy retorna **503** `CONFIG` — sem dados falsos |
| URL localhost em Vercel/production | `getServerApiUrl()` retorna `""` (bloqueio) — evita fallback silencioso |
| Erro de conexão | Proxy retorna **503** `CONNECTION`; cliente mapeia mensagem amigável |
| Simulação de pagamento Express `sim_*` | Bloqueada em produção (ver Fase 1 / pagamentos) |

## Tabela de dependências

| Consumidor | Arquivo | Endpoint Express | Função | Existe equivalente Next | Criticidade | Ação |
| ---------- | ------- | ---------------- | ------ | ----------------------: | ----------- | ---- |
| Core `api()` | `apps/web/src/lib/api.ts` | `/api/ecopet/*` | transport | N/A | ATIVA E CRÍTICA | MIGRAR PARA NEXT.JS |
| URL client | `apps/web/src/lib/api-url.client.ts` | `PROXY_PREFIX` | base URL | N/A | ATIVA E CRÍTICA | MIGRAR PARA NEXT.JS |
| URL server | `apps/web/src/lib/api-url.server.ts` | `API_INTERNAL_URL` | resolve backend | N/A | ATIVA E CRÍTICA | MIGRAR PARA NEXT.JS |
| Proxy route | `apps/web/src/app/api/ecopet/[...path]/route.ts` | catch-all | bridge | N/A | ATIVA E CRÍTICA | REMOVER COMO LEGADO (após migração) |
| Auth bootstrap/password | `apps/web/src/lib/auth/api.ts` | `/api/auth/bootstrap/*`, password | bootstrap admin + senha | parcial (`/api/auth/*`) | ATIVA E CRÍTICA | IMPLANTAR EXPRESS SEPARADAMENTE **ou** MIGRAR |
| Gestor bootstrap UI | `gestor-bootstrap-gate.tsx`, `create-master-admin-form.tsx` | bootstrap | first admin | não | ATIVA E CRÍTICA | IMPLANTAR EXPRESS SEPARADAMENTE |
| Profile/senha | `seus-dados-panel.tsx`, `gestor-change-password.tsx` | profile/password | update | parcial | ATIVA E CRÍTICA | MIGRAR PARA NEXT.JS |
| `use-current-user` | `hooks/use-current-user.ts` | `/api/users/me` | me | `/api/auth/me` | DUPLICADA | MIGRAR PARA NEXT.JS |
| Pets API | `lib/pets/api.ts` | `/api/pets*` | CRUD rico | `/api/client/pets/**` parcial | ATIVA E CRÍTICA | MIGRAR PARA NEXT.JS |
| My Pet UI | `my-pet-dashboard.tsx`, `pets/[id]` | pets | UI | client pets | DUPLICADA | MIGRAR PARA NEXT.JS |
| Public pet slug | `app/pet/[slug]/page.tsx` | `/api/public/pets/:slug` | vitrine | não | ATIVA NÃO CRÍTICA | MIGRAR PARA NEXT.JS |
| Appointments | `lib/appointments/api.ts` + agenda UI | `/api/appointments*` | agenda | `/api/appointments`, client/partner | DUPLICADA | MIGRAR PARA NEXT.JS |
| Orders Express | `lib/orders/api.ts`, `pedidos/page.tsx` | `/api/orders*` | pedidos | `/api/checkout`, client/partner orders | DUPLICADA | MIGRAR PARA NEXT.JS |
| Partner marketplace Express | `lib/marketplace/partner-api.ts` | `/api/marketplace/partner/*` | orders/products | `/api/partner/**` | DUPLICADA | MIGRAR PARA NEXT.JS |
| Logistics | `lib/logistics/api.ts` | `/api/logistics/*` | frete | não | LEGADA | REMOVER COMO LEGADO |
| Wallet | `lib/wallet/api.ts` + panel | `/api/wallet/*` | saldo | finance parcial | ATIVA NÃO CRÍTICA | IMPLANTAR EXPRESS SEPARADAMENTE |
| Gestor modules | `lib/gestor/api.ts` + UIs | `/api/gestor/*` | admin ops | `/api/admin/gestor/**` | DUPLICADA | MIGRAR PARA NEXT.JS |
| Platform centers | `lib/platform/api.ts` + gestor pages | `/api/platform/*` | ERP platform | workflows/events parcial | ATIVA NÃO CRÍTICA | IMPLANTAR EXPRESS SEPARADAMENTE |
| Robots | `lib/robots/api.ts`, `robos/page.tsx` | `/api/robots*` | automações | não | ATIVA NÃO CRÍTICA | IMPLANTAR EXPRESS SEPARADAMENTE |
| IoT / Agro | `lib/iot/api.ts`, iot/agro UIs | `/api/iot*` | devices | `/api/client/iot` parcial | ATIVA NÃO CRÍTICA | IMPLANTAR EXPRESS SEPARADAMENTE |
| Advisory | `lib/advisory/api.ts` | `/api/advisory/*` | insights | não | ATIVA NÃO CRÍTICA | IMPLANTAR EXPRESS SEPARADAMENTE |
| Chat support | `lib/chat/chat-api.ts`, support panel | `/api/chats*` | suporte | `/api/messages/**` | DUPLICADA | MIGRAR PARA NEXT.JS |
| Social conversations | `lib/social/api.ts`, messages UI | `/api/conversations*` | chat | `/api/messages/**` | DUPLICADA | MIGRAR PARA NEXT.JS |
| AI via `api()` | eccopet-ai-shell, assistant, ia page | `/api/ai/*` | chat/conversas | `/api/ai/**` | DUPLICADA | MIGRAR PARA NEXT.JS |
| Adoção | `adocao/page.tsx` | `/api/adoption` | listagens | `/api/public/adoption/**` | DUPLICADA | MIGRAR PARA NEXT.JS |
| i18n translate | `i18n/autoTranslate/client.ts` | `/api/translate*` | tradução | AI translate parcial | INCONCLUSIVA | IMPLANTAR EXPRESS SEPARADAMENTE |
| RegistrationForm legado | `registration-form.tsx` | `/api/auth/register` | cadastro | Next register (foundation) | NÃO UTILIZADA | REMOVER COMO LEGADO |
| CheckoutSteps legado | `checkout-steps.tsx` | orders/logistics/wallet | checkout | `/api/checkout` | NÃO UTILIZADA | REMOVER COMO LEGADO |

## Telas que quebram se Express estiver fora (Vercel sem `API_INTERNAL_URL`)

| Tela / fluxo | Sintoma |
| ------------ | ------- |
| `/pets`, My Pet rico, vacinas/peso via `petsApi` | 503 no proxy |
| `/agenda` (booking via appointmentsApi) | 503 |
| `/pedidos` (path Express) | 503 se ainda usar `orders/api` |
| Gestor bootstrap / create master admin | 503 — bloqueia primeiro admin via Express |
| `/robos`, `/iot`, agro, advisory, platform centers | 503 |
| Support chat legado (`/api/chats`) | 503 |
| Wallet panel | 503 |

**Não quebram** (usam Next direto): login/register foundation, `/api/client/pets`, marketplace cart/checkout Next, social `/api/social`, partner products Next, admin Route Handlers, webhooks MP.

## Recomendação consolidada

1. **Curto prazo (homologação Vercel):** não depender de Express para o funil comercial; documentar UIs Express como degradadas (503 explícito — já implementado).
2. **Médio prazo:** migrar pets/appointments/orders/chat/AI clients ainda no `api()` para Route Handlers Next (**MIGRAR PARA NEXT.JS**).
3. **Se precisar de Socket.io / platform/iot/robots agora:** **IMPLANTAR EXPRESS SEPARADAMENTE** (Railway/Render) + `API_INTERNAL_URL` não-localhost.
4. **Não** remover `apps/api` nesta fase; após migração das críticas, **REMOVER COMO LEGADO** o proxy e libs mortas.
