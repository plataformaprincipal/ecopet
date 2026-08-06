# Auditoria Técnica Completa — EccoPet

**Data:** 2026-08-06  
**Escopo:** monorepo `ecopet` (`apps/web`, `apps/api`, `packages/database`)  
**Método:** leitura de código + execução de comandos + análise de schema/migrations/git + testes locais  
**Regra aplicada:** funcionalidade só é “operacional” com evidência verificável ponta a ponta  
**Correções:** nenhuma alteração de código foi feita nesta auditoria

---

## 1. Resumo executivo

| Pergunta | Resposta com evidência |
| -------- | ---------------------- |
| O sistema abre / o código compila? | **Sim.** `npm run build` concluiu com EXIT 0 (Next.js 15.5.18). |
| O build passa? | **Sim.** Lint OK; type-check OK **após** `db:generate`; build OK. |
| O banco está íntegro? | **Parcialmente.** Schema Prisma válido (216 models); DB Supabase local configurado está “up to date” com 27 migrations. **Porém 20/27 migrations SQL estão ignoradas pelo Git** (`*.sql` no `.gitignore`) — clone fresco / CI não reproduzem o histórico completo. |
| As integrações estão reais? | **Mistas.** Mercado Pago (Orders + webhook HMAC + idempotência) tem caminho real; Stripe/Pagar.me são stubs; OpenAI fail-closed; Cloudinary/Resend/TalkJS/Turnstile/Firebase/Maps dependem de credencial. |
| Pronta para vender (dinheiro real)? | **Não.** `PAYMENT_PROVIDER` tratado como `none/manual` no ambiente local; split/repasse **não implementados**; comissões hardcoded só em KPIs; Express ainda pode marcar pedido `PAID` com `sim_*`. |
| Pronta só para homologação? | **Sim, com ressalvas** — fluxos de auth, catálogo, carrinho API, checkout sem gateway, pedidos, ONG e admin têm backend Next + Prisma; pagamentos online e partes Express exigem setup extra. |
| O que impede o lançamento comercial? | Migrations fora do Git; ausência de split/repasse; aprovação de parceiro não é gate; confirmação de e-mail inexistente; `apps/api` fora da Vercel com UIs ainda no proxy; Stripe stub perigoso no Express; testes de experiência falhando; pagamentos/webhook não validados em produção. |

### Veredito (antecipado)

```text
PODE SER HOMOLOGADO
```

**Não** está pronto para produção comercial. Homologação técnica de fluxos não-financeiros (e sandbox MP com credenciais) é viável após corrigir o versionamento das migrations.

---

## 2. Classificação geral

```text
NÍVEL 2 — desenvolvimento integrado
```

Justificativa:

- Existe monorepo real, Next.js com ~393 Route Handlers, Prisma com 216 models, testes foundation e e2e.
- Não é “só interface” (NÍVEL 0/1).
- Não atinge NÍVEL 3 pleno: histórico de migrations quebrado no Git, pagamentos sem split, gates comerciais frouxos, dual-API incompleta.
- Longe de NÍVEL 4/5 (piloto controlado / produção comercial).

---

## 3. Arquitetura real

### Estrutura

| Item | Evidência |
| ---- | --------- |
| Monorepo? | **Sim** — npm workspaces (`apps/*`, `packages/*`) em `package.json` |
| Apps | `@ecopet/web` (Next.js 15), `@ecopet/api` (Express 5 + Socket.io) |
| Packages | `@ecopet/database` (Prisma) — único package de domínio |
| Turbo? | **Não** — sem `turbo.json` |
| Deploy Vercel | `apps/web/vercel.json` — framework Next, install/build na raiz |
| Express na Vercel? | **Não** — docs e `.env.example` dizem explicitamente que Express é opcional/separado |

### Diagrama textual da arquitetura efetivamente implantável

```text
Cliente (browser)
↓
Frontend Next.js (apps/web)  ← ÚNICO artefato publicado na Vercel
↓
├── Route Handlers /api/*  (auth, marketplace, cart, checkout, social,
│                           admin, AI, webhooks, partner, ong, messages…)
│         ↓
│   Prisma Client (@ecopet/database)
│         ↓
│   PostgreSQL Supabase (DATABASE_URL pooler :6543)
│         ↓
│   Serviços externos (Resend, Cloudinary, Mercado Pago, OpenAI,
│                      TalkJS, Turnstile, Firebase FCM, Google Maps…)
│
└── /api/ecopet/*  → proxy → Express apps/api :4000
          ↓                 (NÃO sobe na Vercel)
    Prisma + Socket.io
    (pets rico, wallet, iot, robots, gestor legado, carts/orders legados)
```

### Classificação arquitetural

```text
Arquitetura híbrida incompleta + APIs duplicadas + endpoints sem deploy
```

- **Primário em produção:** apenas Next.js Route Handlers.
- **Express:** legado/opcional; necessário para UIs que usam `api()` → `/api/ecopet/*` (pets avançado, wallet, IoT, robots, platform, gestor legado, etc.).
- Sem `API_INTERNAL_URL` apontando para host Express, o proxy retorna **503** (`apps/web/src/app/api/ecopet/[...path]/route.ts`).

### Contagens

| Métrica | Valor |
| ------- | ----: |
| `page.tsx` | 468 |
| `route.ts` (API Next) | 393 |
| Models Prisma | 216 |
| Migrations locais | 27 |
| Migrations SQL no Git HEAD | **7** |

---

## 4. Resultados dos comandos obrigatórios

Ambiente de execução: Node **v24.16.0**, npm **11.13.0** (engines pedem `>=20`).

### 4.1 `node -v` / `npm -v`

| Campo | Valor |
| ----- | ----- |
| Resultado | OK |
| Erro | nenhum |
| Impacto | nenhum |
| Nota | Node 24 > engines; Vercel deve fixar 20.x ou 22.x LTS |

### 4.2 `npm ci`

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 0** |
| Erro | warnings de depreciação (uuid, glob, etc.) |
| Impacto | baixo |
| Correção | atualizar deps deprecated em ciclo separado |

### 4.3 `npm run lint`

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 0** — “No ESLint warnings or errors” |
| Erro | aviso de depreciação do `next lint` (Next 16) |
| Impacto | baixo |

### 4.4 `npm run type-check` (1ª execução, sem generate)

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 2** |
| Erro | `@prisma/client` sem exports (`UserRole`, `User`, etc.) em `packages/database` |
| Arquivo | `packages/database/src/index.ts`, `user.repository.ts`, `diagnostics.ts` |
| Causa | Prisma Client não gerado após `npm ci` limpo |
| Impacto | **ALTO** — CI/type-check falha se generate não rodar antes |
| Correção | garantir `db:generate` (já no `scripts/build-web.mjs`) também no script `type-check` / CI pré-check |

### 4.5 `npm run db:generate`

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 0** — Prisma Client v6.19.3 gerado |
| Impacto | desbloqueia type-check |

### 4.6 `npm run type-check` (após generate)

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 0** (database + web + api) |

### 4.7 `npm run build`

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 0** |
| Observação | “Compiled with warnings”; middleware ~152 kB; centenas de rotas geradas |
| Impacto | build passar **não** prova integrações/pagamentos |

### 4.8 `npm run test`

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 1** — 2 etapas falharam |
| Falhas | `test:client-experience` (1 falha: redirect CLIENT → `/client` vs código `/cliente`); `test:ngo-experience` (8 falhas: rotas renomeadas `animals`→`animais`, `adoptions`→`adocoes`, etc.) |
| Passaram | no-mocks, empty-states, i18n, permissions unit, partner-experience, ngo-flows (Prisma), catalog-delete-guards, cloudinary, admin-access |
| HTTP | vários testes HTTP **ignorados** — servidor indisponível |
| Impacto | **MÉDIO** — drift entre testes de navegação e rotas reais |

### 4.9 `npm run db:migrate:deploy`

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 0** — “27 migrations found… No pending migrations” |
| DB | Supabase pooler `sa-east-1` (host mascarado no log) |
| Impacto | OK **neste** workspace; **não** garante clone/CI |

### 4.10 `npx prisma validate`

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 0** — schema válido |

### 4.11 `npx prisma migrate status`

| Campo | Valor |
| ----- | ----- |
| Resultado | **EXIT 0** — “27 migrations found… Database schema is up to date!” |
| Risco | status depende dos arquivos **locais** (inclui ignorados pelo Git). Em clone limpo só haveria **7** SQLs versionados. |

---

## 5. Auditoria do deploy Vercel

### Configuração atual (código)

Arquivo: `apps/web/vercel.json`

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && npm ci",
  "buildCommand": "cd ../.. && npm run build",
  "regions": ["gru1"]
}
```

Docs: `docs/deploy/vercel.md` — Root Directory `apps/web`.

### O que a Vercel publica

| Publicado | Não publicado |
| --------- | ------------- |
| `apps/web` (UI + Route Handlers) | `apps/api` (Express + Socket.io) |
| Prisma Client gerado no build | Processo Node contínuo / websockets Express |
| Middleware Edge | Migrations automáticas (precisam job/CI separado) |

### Riscos

1. **Express fora do ar** → qualquer tela usando `api()` / `/api/ecopet/*` quebra em produção (503).
2. **Migrations não versionadas** → novo ambiente não aplica schema completo via `migrate deploy` a partir do Git.
3. Build pode passar **com integrações desligadas** (`PAYMENT_PROVIDER=none`, `AI_ENABLED=false`) — correto para build, perigoso se confundido com “pronto”.
4. `UPLOAD_DEV_FALLBACK` não deve ir para Production (documentado; risco operacional se copiado).

### Configuração recomendada

```text
Root Directory:     apps/web
Framework Preset:   Next.js
Install Command:    cd ../.. && npm ci
Build Command:      cd ../.. && npm run build
Output Directory:   (deixar padrão Next — não sobrescrever)
Node.js Version:    22.x (LTS) — alinhar com engines >=20; evitar 24 em Production até validar
```

**URLs a configurar (mesmo valor HTTPS canônico):**

- `NEXTAUTH_URL`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`

**Não configurar na Vercel (se só web):** `API_INTERNAL_URL`, `UPLOAD_DEV_FALLBACK=1`, flags de teste OTP.

**Se precisar de Socket.io / pets Express:** host separado (Railway/Render/Fly) + `API_INTERNAL_URL` interno — ou migrar 100% para Route Handlers.

---

## 6. Variáveis de ambiente

Catálogo canônico: `apps/web/src/lib/env-registry.ts` (~158 entradas).  
Exemplos: `.env.example`, `apps/web/.env.example`, `.env.vercel.production.example`.  
Validação runtime: `apps/web/src/lib/validate-production-env.ts`.

> **Segurança do relatório:** valores reais de `.env` **não** são reproduzidos. Nomes e classificação apenas.

### Classificação

| Classe | Variáveis (principais) |
| ------ | ---------------------- |
| Obrigatória para iniciar (runtime auth/DB) | `DATABASE_URL`, `AUTH_SECRET` ou `NEXTAUTH_SECRET` |
| Obrigatória para produção | Acima + `DIRECT_URL` (migrations), `NEXTAUTH_URL`, `APP_URL`, `NEXT_PUBLIC_APP_URL` (HTTPS não-localhost), e-mail (Resend ou SMTP), Cloudinary (sem fallback), Turnstile se habilitado, `MERCADO_PAGO_WEBHOOK_SECRET` se token MP set |
| Opcional com degradê | OpenAI/AI, TalkJS, Firebase/VAPID, Maps, GA/GTM, Twilio, Better Stack |
| Express-only (só se deployar API) | `JWT_SECRET`, `WEB_URL`, `API_PORT`, `API_INTERNAL_URL` |
| Incorretamente tratada como opcional (risco) | Cloudinary/e-mail em produção (warn, não hard-fail completo); aprovação comercial sem gate |
| Perigosa se set em prod | `UPLOAD_DEV_FALLBACK`, `AUTH_TEST_EXPOSE_OTP`, `TURNSTILE_DEV_BYPASS`, `FORCE_INSECURE_SESSION_COOKIE`, `ALLOW_TEST_RESEND`, `AUTH_RATE_LIMIT_DISABLED` |

### Tabela (núcleo)

| Variável | Arquivo(s) que utiliza | Obrigatória | Ambiente | Serviço | Fallback | Risco se ausente |
| -------- | ---------------------- | ----------: | -------- | ------- | -------- | ---------------- |
| `DATABASE_URL` | schema.prisma, client.ts, web/api | Sim | todos | Supabase/Postgres | nenhum | app não sobe |
| `DIRECT_URL` | schema.prisma directUrl | Sim p/ migrate | CI/ops | Postgres direto | nenhum | migrations falham |
| `AUTH_SECRET` | auth-session, edge/session | Sim | todos | JWT cookie | NEXTAUTH_SECRET | login/sessão quebram |
| `NEXTAUTH_SECRET` | auth-secret fallback | Sim se sem AUTH | todos | JWT | AUTH_SECRET | idem |
| `NEXTAUTH_URL` | NextAuth stub / URLs | Sim prod | prod | app URL | localhost em lib | cookies/redirect errados |
| `APP_URL` | mail, password-reset, app-url | Sim prod | prod | links | localhost | e-mails com link errado |
| `NEXT_PUBLIC_APP_URL` | client/social/utils | Sim prod | prod | frontend | localhost | SEO/share/links |
| `API_INTERNAL_URL` | api-url.server, proxy | Só se Express | prod opcional | Express | localhost:4000 (dev) / "" (prod) | `/api/ecopet` → 503 |
| `NEXT_PUBLIC_API_URL` | api-url.client | Não | — | override API | `/api/ecopet` | aponta clientes ao proxy |
| `JWT_SECRET` | apps/api | Se Express | api | JWT Express | — | API Express insegura/quebra |
| `WEB_URL` | apps/api | Se Express | api | CORS/links | localhost:3000 | links errados |
| `RESEND_API_KEY` | email enterprise | Recom. prod | prod | Resend | SMTP | recovery/welcome falham |
| `EMAIL_FROM` | email | Recom. prod | prod | Resend | — | e-mails rejeitados |
| `CLOUDINARY_*` | upload | Recom. prod | prod | Cloudinary | UPLOAD_DEV_FALLBACK | upload prod falha |
| `UPLOAD_DEV_FALLBACK` | upload service | Nunca em prod | dev | local disk | — | bypass inseguro |
| `PAYMENT_PROVIDER` | payment-service | Ops | todos | gateway | none/manual | cobrança desligada |
| `MERCADO_PAGO_ACCESS_TOKEN` | mp client | p/ cobrar | prod/hom | MP | — | checkout MP 503 |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | checkout UI | p/ cobrar | prod/hom | MP | — | UI sem brick |
| `MERCADO_PAGO_WEBHOOK_SECRET` | webhook pipeline | se token set | prod | MP | processa sem verify em non-prod | fraude/webhook falso |
| `STRIPE_*` | stubs | Não (stub) | — | Stripe | not_configured | falsa sensação de pronto |
| `AI_ENABLED` / `OPENAI_API_KEY` | ai-config, gateway | p/ IA | prod | OpenAI | fail-closed | chat IA indisponível |
| `TALKJS_*` | talkjs server | p/ chat TalkJS | prod | TalkJS | degradê | mensagens limitadas |
| `TURNSTILE_*` | turnstile | se enabled | prod | Cloudflare | bypass só dev | bots / bloqueio |
| `FIREBASE_*` / VAPID | push | p/ push | prod | FCM | in-app only | sem push |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | maps | p/ mapas | prod | Google | features off | mapas off |
| `TWILIO_*` | SMS recovery | se SMS on | prod | Twilio | e-mail only | recovery SMS off |

### Divergências encontradas

- Registry vs `.env.example`: várias chaves só em um lado (`TURNSTILE_DEV_BYPASS`, `OTEL_*`, bootstrap, etc.).
- Código usa `WHATSAPP_ACCESS_TOKEN` em pontos; registry documenta `WHATSAPP_API_TOKEN` / `WHATSAPP_BUSINESS_TOKEN`.
- `ALLOW_TEST_RESEND` listado no audit de produção, mas rota `test-resend` gateia por `NODE_ENV`/`VERCEL_ENV`.
- Docs antigos (`docs/release/final-audit-report.md`) afirmam “27 migrations” versionadas — **falso no Git atual** (só 7 SQLs).

---

## 7. Banco de dados

### Schema e migrations

| Item | Status |
| ---- | ------ |
| `schema.prisma` | Válido; PostgreSQL; `url` + `directUrl` |
| Models | 216 |
| Migrations locais | 27 diretórios |
| Migrations no Git | **7** SQLs + `migration_lock.toml` |
| Causa | `.gitignore` linha `*.sql` ignora `packages/database/prisma/migrations/**/migration.sql` |
| Evidência | `git check-ignore -v …/migration.sql` → `.gitignore:29:*.sql` |
| DB auditado | “up to date” com as 27 locais |
| Seed | `prisma/seed.ts` — `test:no-mocks` confirma que não cria massa fake de marketplace |

### Singleton Prisma / serverless

- `packages/database/src/client.ts`: singleton em non-production; em Vercel adiciona `connection_limit=1` + `sslmode=require`.
- Adequado para serverless com pooler; migrations devem usar `DIRECT_URL`.

### Mapa módulo → modelos (resumo)

| Módulo | Modelos principais | Migrations | Uso real | Risco |
| ------ | ------------------ | ---------- | -------- | ----- |
| Usuários | `User`, `UserSession`, `LoginLog`, profiles | init + admin_approval | Next auth routes | médio — e-mail verify ausente |
| Pets | `Pet`, weight/media/events… | etapa5 | Next `/api/client/pets` + Express `/api/pets` | **alto** dual-path |
| Parceiros | `PartnerProfile`, docs | partner_register, docs_cnpj | register ACTIVE imediato | **alto** gate frouxo |
| ONGs | `OngProfile`, `AdoptionListing`… | init + | Next ong APIs; ngo-flows OK | médio — testes nav drift |
| Produtos/Serviços | `Product`, `Service`, inventory | marketplace migrations | partner APIs Next | baixo-médio |
| Carrinho | `Cart`, `CartItem` | marketplace | `/api/cart` | **médio** Zustand paralelo |
| Pedidos | `Order`, `OrderItem`, history | order_status | checkout-service | baixo |
| Pagamentos | `Payment`, `PaymentRefund`, `MpWebhookEvent`… | mp_* (muitas **fora do Git**) | MP real no web | **crítico** versionamento |
| Assinaturas | enums/planos; páginas MP assinaturas | — | NOT_APPLICABLE em admin | placeholder |
| Comissões/Repasses | sem modelo de fee configurável | — | KPI 10%/8% hardcoded | **crítico** comercial |
| Rede social | `SocialPost*` (+ legado `Post`) | social_post_persona (**fora Git**) | `/api/social` | médio |
| Notificações | `Notification*` | notification_center (**fora Git**) | in-app OK | médio |
| Chat | `Conversation`, `Message` + TalkJS | — | Next messages + TalkJS | dep. credencial |
| IA | `AIProvider`, `AIConversation`… | ai_* (**fora Git**) | fail-closed sem key | médio |
| Admin/Logs | `AuditLog`, RBAC, settings | admin_approval | guards server | médio |
| Config | `PlatformSettings` | — | **sem** campos de comissão | alto |

---

## 8. Matriz de funcionalidades

| Módulo | Frontend | Backend | Banco | Integração | Produção | Status |
| ------ | -------: | ------: | ----: | ---------: | -------: | ------ |
| Auth login/register | OK | Next OK | User OK | Turnstile/Resend opc. | parcial | **PARCIAL** |
| Confirmação e-mail | ausente | ausente | `isVerified` sem gate | template deprecated OTP `000000` | não | **NÃO EXISTE** |
| Recuperação senha OTP | OK | Next OK | VerificationCode | Resend/SMS | dep. credencial | **DEPENDENTE DE CREDENCIAL** |
| Sessão/middleware | OK | Edge+JWT | sessions | — | OK se secrets | **FUNCIONAL** (páginas); APIs sem middleware |
| Cliente pets | 2 UIs | Next + Express | Pet | — | Express off na Vercel | **PARCIAL** |
| Marketplace catálogo | OK | Next | Product/Service | — | OK | **FUNCIONAL** |
| Carrinho | OK + Zustand | Next cart | Cart | — | OK API | **PARCIAL** (dual cart) |
| Checkout pedido | OK | checkout-service | Order | — | OK sem gateway | **FUNCIONAL** |
| Pagamento MP | UI | create-checkout-order | Payment | MP API | precisa Live/test keys | **DEPENDENTE DE CREDENCIAL** |
| Webhook MP | — | pipeline HMAC+idempotency | MpWebhookEvent | MP | precisa secret+URL | **DEPENDENTE DE INFRAESTRUTURA** |
| Split/repasse | UI financeiro | `splitImplemented: false` | fee null | — | não | **MOCK / PLACEHOLDER** |
| Stripe | — | stub | — | não | não | **MOCK** |
| Rede social | OK | `/api/social` | SocialPost | Cloudinary | OK | **FUNCIONAL** (core) |
| Chat TalkJS | OK | messages + TalkJS | Conversation | TalkJS | dep. | **DEPENDENTE DE CREDENCIAL** |
| IA | UI rica | gateway OpenAI | AI* | OpenAI | fail-closed | **DEPENDENTE DE CREDENCIAL** |
| Parceiro produtos | OK | partner APIs | Product | — | auto-APPROVED | **FUNCIONAL** |
| Aprovação parceiro | admin UI | reviewAccount | PartnerProfile | e-mail | **não bloqueia comércio** | **PARCIAL** |
| ONG adoção/campanhas | OK | ong APIs | Adoption* | — | ngo-flows OK | **FUNCIONAL** |
| Admin dashboard | OK | requireAdmin | vários | — | OK | **FUNCIONAL** (read) |
| ERP parceiro “completo” | muitas páginas | parcial/estimado | — | — | — | **APENAS INTERFACE** (várias áreas) |
| IoT / Robôs / Agro | UI | Express/mocks | models | — | Express off | **DEPENDENTE DE INFRA / PLACEHOLDER** |
| VLibras | widget | script gov.br | — | VLibras CDN | OK | **FUNCIONAL** (a11y externa) |
| Shopee / Amazon | — | — | — | — | — | **NÃO IMPLEMENTADA** |

Legenda de status alinhada ao pedido: FUNCIONAL / PARCIAL / APENAS INTERFACE / MOCK / PLACEHOLDER / DEPENDENTE DE CREDENCIAL / DEPENDENTE DE INFRAESTRUTURA / QUEBRADA / NÃO UTILIZADA / NÃO FOI POSSÍVEL VALIDAR.

---

## 9. Problemas críticos

| ID | Problema | Gravidade | Evidência | Impacto | Correção |
| -- | -------- | --------- | --------- | ------- | -------- |
| B01 | 20 migrations SQL fora do Git (`*.sql` ignore) | **BLOQUEADOR** | `.gitignore:29`; 27 locais vs 7 no HEAD | Novos ambientes sem schema MP/AI/refunds/etc. | Remover ignore de migrations Prisma; `git add -f` das 20 pastas; validar CI `migrate deploy` |
| B02 | Split/repasse/comissão comercial não implementados | **BLOQUEADOR** (venda real) | `create-checkout-order.ts` `splitReady: false`; `payment-views.ts` `splitImplemented: false`; comissão 10%/8% hardcoded | Dinheiro errado / sem payout | Modelo de fee versionado + snapshot no pedido + ledger |
| B03 | Express `order-service` marca `PAID` com `sim_*` | **CRÍTICO** | `apps/api/src/services/order-service.ts:121-128` | Pedido “pago” sem gateway se path Express usado | Remover simulação; exigir webhook/gateway real |
| B04 | `apps/api` não deployado; UIs ainda usam proxy | **CRÍTICO** | proxy 503 sem `API_INTERNAL_URL`; `petsApi`/`wallet`/`iot`/`gestor` | Features quebradas em Vercel | Migrar restantes para Next ou deployar API |
| B05 | Aprovação parceiro não é gate comercial | **CRÍTICO** | register `ACTIVE`; `requireApprovedPartner` = `requirePartner`; comentário explícito | Parceiro opera sem KYC | PENDING até approve; filtrar fila correta |
| B06 | Confirmação de e-mail inexistente | **ALTO** | sem `/verificar`; template deprecated OTP `000000` | Contas não verificadas | Fluxo verify real ou remover claims |
| B07 | Dual carrinho (API vs Zustand detalhe produto) | **ALTO** | product-detail Zustand vs `/api/cart` | Usuário acha que comprou e checkout vazio | Unificar add-to-cart na API |
| B08 | Stripe/Pagar.me webhook header-only | **ALTO** | `webhook-handler.ts` / `payment-webhook.ts` | Aceitar webhooks falsos se rota exposta | Desabilitar rotas ou HMAC real |
| B09 | Testes experiência CLIENT/ONG falhando | **MÉDIO** | `npm run test` EXIT 1 | CI vermelho / drift rotas | Alinhar `dashboardPathForRole` e nav ONG |
| B10 | Type-check depende de generate prévio | **MÉDIO** | type-check falhou pós-`npm ci` limpo | CI frágil | `type-check` chamar generate |
| B11 | Docs de release desatualizados (“APROVADO PRODUÇÃO”) | **MÉDIO** | `docs/release/final-audit-report.md` | Decisão errada de go-live | Invalidar parecer antigo |
| B12 | Webhook MP sem secret em non-prod processa | **MÉDIO** | `pipeline.ts:142` | Homolog insegura se exposta | Exigir secret também em preview |

---

## 10. Integrações

| Integração | Código | Credencial | Chamada real | Webhook | Validada | Status |
| ---------- | -----: | ---------: | -----------: | ------: | -------: | ------ |
| Supabase (Postgres) | Prisma | sim (local) | sim | n/a | local migrate status | **FUNCIONANDO LOCALMENTE** |
| Prisma | package | — | sim | n/a | validate OK | **CONFIGURADA** |
| OpenAI | SDK web | flag/key | sim se on | n/a | unit tests | **PRONTA PARA CREDENCIAL** (fail-closed) |
| Mercado Pago | client Orders | token/key | sim | HMAC+idempotency | unit tests; prod NÃO | **PRONTA PARA HOMOLOGAÇÃO** (sandbox) |
| Stripe | stub web; dep unused api | — | não | header-only | não | **INTERFACE PREPARADA / NÃO IMPLEMENTADA** |
| Cloudinary | signed upload | 3 vars | sim | n/a | unit 33 OK | **PRONTA PARA CREDENCIAL** |
| Resend | email enterprise | key | sim | n/a | testes e-mail | **PRONTA PARA CREDENCIAL** |
| TalkJS | SDK + server | app id/secret | sim | HMAC opcional | unit | **PRONTA PARA CREDENCIAL** |
| Firebase FCM | admin+web | várias | sim se on | n/a | unit | **PRONTA PARA CREDENCIAL** |
| Google Maps | loader+server | key | sim se on | n/a | unit | **PRONTA PARA CREDENCIAL** |
| Turnstile | verify server | site+secret | sim | n/a | unit | **PRONTA PARA CREDENCIAL** |
| Twilio | SMS | SID/token | se enabled | n/a | — | **PRONTA PARA CREDENCIAL** |
| VLibras | widget CDN | n/a | script gov.br | n/a | unit vlibras | **CONFIGURADA** |
| Shopee | — | — | não | não | não | **NÃO IMPLEMENTADA** |
| Amazon | — | — | não | não | não | **NÃO IMPLEMENTADA** |
| Vercel | vercel.json | projeto | build OK | n/a | build local | **PRONTA PARA HOMOLOGAÇÃO** (deploy remoto NÃO TESTADO nesta sessão) |
| Supabase Storage | comentário | — | not implemented | — | — | **NÃO IMPLEMENTADA** |
| Pagar.me | stub | — | não | fraco | não | **NÃO IMPLEMENTADA** |

Perguntas fechadas por integração (síntese):

1. Só preparatório? Stripe/Pagar.me/Shopee/Amazon/Storage — **sim**.  
2–5. SDK/cliente/credencial/chamada — MP/OpenAI/Cloudinary/Resend/TalkJS/Firebase/Maps/Turnstile: código real; ativação = credencial.  
6. Webhook — MP **sim** (forte); TalkJS parcial; Stripe **fraco**.  
7. Persistência — MP/Payment/AI/Notifications no Prisma.  
8. Erros — fail-closed em AI/MP webhook prod.  
9. Testes — unitários vários; E2E aceitação existe mas não reexecutado completo aqui.  
10. Produção comercial — **não** sem B01–B05 e validação Live.

---

## 11. Pagamentos, comissões e repasses

### O que está implementado (web / Mercado Pago)

- Criação de order MP com idempotency key (`create-checkout-order.ts`, `client.ts`).
- Webhook com HMAC, fail-closed em production sem secret, dedupe por event id/hash (`webhooks/pipeline.ts`, `idempotency.ts`).
- Aplicação de status no `Payment`/`Order` (`apply-payment-status.ts`).
- Refunds via API MP + fluxo admin de estornos.
- Reconciliação interna de inconsistências (`reconciliation.ts`) — **não** é settlement bancário completo.

### O que NÃO está seguro para dinheiro real

| Tema | Situação |
| ---- | -------- |
| `PAYMENT_PROVIDER=none` | Manual/PENDING; sem cobrança externa |
| Split marketplace | `splitReady: false`, `platformFeeEstimated: null` |
| Comissão | 10% admin dashboard / 8% ERP — **estimativas hardcoded**, não no checkout |
| Snapshot de regra no pedido | não há versionamento comercial de fee |
| Stripe | stub; Express ainda simula pago |
| Confirmação só no frontend | path MP correto usa webhook; path Express `sim_*` é perigoso |
| Chargeback/disputas | modelos/UI MP existem; operação Live não validada |

### Preços comerciais

```text
apenas em documentação / hardcoded em KPIs
NÃO armazenados como regra configurável no PlatformSettings
NÃO aplicados no checkout
NÃO registrados como snapshot financeiro de split
```

### Resposta direta

**Não é seguro receber dinheiro real em produção comercial** até: provider Live + webhook secret + testes E2E de pagamento + remoção de simulações Express + implementação de split/ledger + migrations versionadas.

---

## 12. Mocks, placeholders e falsa prontidão

| Arquivo | Funcionalidade | Comportamento | Risco | Correção |
| ------- | -------------- | ------------- | ----- | -------- |
| `apps/api/.../order-service.ts:121-128` | pagamento Express | `stripePaymentId: sim_*` → PAID | crítico | remover |
| `apps/web/.../payments/providers/stripe.ts` | Stripe | “ainda não está ligado ao SDK” | alto | ocultar/desabilitar |
| `apps/web/.../webhooks/payment-webhook.ts` | Stripe/Pagar.me | só checa header | alto | HMAC ou 410 Gone |
| `create-checkout-order.ts` / `payment-views.ts` | split | flags false | crítico comercial | implementar ou esconder UI |
| `admin/dashboard-service.ts:282+` | comissão | 10% fixo | alto | config versionada |
| `partner-erp-service.ts:212` | comissão | 8% fixo | alto | idem |
| `gestor-modules-service.ts:383-388` | health | healthy/mock sem probe | médio | probes reais |
| `email-verification.ts` | verify e-mail | OTP `"000000"` deprecated | alto | apagar ou implementar |
| `cpf-service.ts` | CPF | “em breve” name match | baixo | label honesto |
| `upload/service.ts` | Supabase storage | not implemented | baixo | remover opção |
| `settings-hub.tsx` | 2FA/OAuth | “Em preparação” | baixo | ok se honesto |
| Admin MP assinaturas/point/envios | features MP | NOT_APPLICABLE | baixo | ok |
| product-detail Zustand cart | carrinho | localStorage ≠ API | alto | unificar |
| Agro chart/map mocks | agro | mock components | baixo | fora do MVP |

`npm run test:no-mocks` passou para fixtures óbvios — **não** cobre os casos acima.

---

## 13. Segurança

### Controles presentes

- Cookie `ecopet-session` httpOnly, SameSite=lax, Secure em production.
- Rate limit em auth (distribuído), social, AI, uploads.
- RBAC server-side (`requireAdmin`, `requireRole`, guards de layout).
- Turnstile integrado no register/login (quando enabled).
- Upload: allowlist MIME, bloqueio SVG/HTML/exe, assinatura Cloudinary.
- Headers de segurança + CSP (com exceções VLibras/TalkJS/MP).
- Webhook MP com HMAC + timingSafeEqual.
- Ownership checks em pets/orders/messages (amostra positiva).

### Riscos antes do lançamento

| Risco | Detalhe |
| ----- | ------- |
| Middleware **não** protege `/api/*` | Toda rota nova precisa `requireAuth` — omissão = API aberta |
| Parceiro ACTIVE sem KYC | comércio sem aprovação real |
| Webhooks genéricos fracos | Stripe/Pagar.me/WhatsApp |
| Express simulação de pagamento | se exposto |
| Secrets em NEXT_PUBLIC_ | não há tokens privados no registry público; manter disciplina |
| CSP `unsafe-inline`/`unsafe-eval` | aceito por VLibras — superfície XSS residual |
| LGPD | export/privacy routes existem; processo DPO/retenção operacional não auditado aqui |
| IDOR residual | padrão bom em amostras; precisa checklist em rotas `[id]` novas |

---

## 14. Fluxo principal (20 etapas)

| # | Etapa | Frontend | Endpoint | Service | Banco | Integração | Status | Erro provável |
| - | ----- | -------- | -------- | ------- | ----- | ---------- | ------ | ------------- |
| 1 | Cliente cria conta | cadastro/onboarding | `POST /api/auth/register` | register route | User | Turnstile/Resend | **FUNCIONAL** | Turnstile/rate-limit |
| 2 | Confirma e-mail | — | — | template morto | — | — | **NÃO EXISTE** | — |
| 3 | Login | login | `POST /api/auth/login` | login route | User/Session | Turnstile | **FUNCIONAL** | status SUSPENDED |
| 4 | Cadastra pet | client-my-pet / my-pet | `/api/client/pets` **ou** `/api/ecopet/pets` | Next vs Express | Pet | — | **PARCIAL** | Express 503 na Vercel |
| 5 | Parceiro cria conta | partner-register | `POST /api/auth/register` | createPartnerUser ACTIVE | User+PartnerProfile | — | **FUNCIONAL** | — |
| 6 | Admin aprova | admin/approvals | `PATCH /api/admin/accounts/[id]` | reviewAccount | PartnerProfile | e-mail | **PARCIAL** | fila PENDING vazia p/ ACTIVE |
| 7 | Cadastra produto/serviço | partner panels | `/api/partner/products\|services` | partner routes | Product/Service | — | **FUNCIONAL** | — |
| 8 | Publicado | marketplace | public queries | public-query | approval APPROVED auto | — | **FUNCIONAL** (auto) | sem moderação humana |
| 9 | Carrinho | cart-panel / detail | `/api/cart/items` vs Zustand | cart-service | Cart | — | **PARCIAL** | detalhe não persiste API |
| 10 | Checkout | checkout-panel | `POST /api/checkout` | checkoutFromCart | Order | — | **FUNCIONAL** | estoque |
| 11 | Pagamento criado | MP checkout | `/api/checkout/mercado-pago/order` | create-checkout-order | Payment | MP | **DEP. CREDENCIAL** | 503 sem token |
| 12 | Webhook | — | `/api/webhooks/mercado-pago` | pipeline | MpWebhookEvent | MP | **DEP. INFRA** | secret/URL |
| 13 | Pedido atualizado | — | apply-payment-status | — | Order | — | **FUNCIONAL** c/ MP | race/dupe mitigado |
| 14 | Parceiro recebe | partner/orders | `GET /api/partner/orders` | + notification | Order+Notification | push opc. | **FUNCIONAL** | — |
| 15 | Cliente notificado | notifications | createInternalNotification | dispatcher | Notification | Resend/FCM | **PARCIAL** | e-mail/push off |
| 16 | Parceiro status | orders-panels | `PATCH .../status` | transitions | Order | e-mail | **FUNCIONAL** | transição inválida |
| 17 | Admin acompanha | admin/orders, financeiro | admin APIs | — | Order/Payment | — | **FUNCIONAL** | — |
| 18 | Cancelamento | client cancel | cancel route | stock+MP cancel | Order | MP | **FUNCIONAL** pré-confirmação | pós-pago ≠ cancel |
| 19 | Estorno | admin estornos | financeiro/estornos | executePaymentRefund | PaymentRefund | MP | **DEP. CREDENCIAL** | token |
| 20 | Conciliação | admin conciliacao | mercado-pago/reconcile | reconciliation | MpReconciliationIssue | — | **PARCIAL** | não é settlement |

---

## 15. Problemas da Vercel (síntese)

| Tema | Situação |
| ---- | -------- |
| Config atual | Root `apps/web`; install/build monorepo; região `gru1` |
| Config correta | ver §5; Node 22 LTS; env Production sem localhost |
| Serviços não implantados | Express `apps/api`, Socket.io, workers long-running (jobs usam enfileiramento in-process limitado) |
| Variáveis faltantes em prod típico | secrets reais + e-mail + Cloudinary + Turnstile + (se vender) MP Live + webhook |
| Risco monorepo | esquecer Root Directory; build sem generate (mitigado por `build-web.mjs`); migrations fora do Git |

---

## 16. Plano de correção

### Fase 1 — bloqueadores

| Tarefa | Arquivo | Dependência | Aceite | Teste | Risco |
| ------ | ------- | ----------- | ------ | ----- | ----- |
| Versionar migrations Prisma | `.gitignore`, `packages/database/prisma/migrations/**` | nenhum | 27 SQLs no Git; `migrate deploy` em DB vazio aplica schema completo | CI migrate + `prisma migrate status` | drift se DB já parcial |
| Remover `sim_*` Express | `apps/api/src/services/order-service.ts` | decisão API | nunca PAID sem gateway | contract test | quebra clients Express |
| Decidir destino Express | proxy + clients `lib/*/api.ts` | produto | zero 503 em prod ou API deployada | smoke `/api/ecopet/health` | esforço alto |
| Gate aprovação parceiro | `register/route.ts`, `require-auth.ts` | produto/legal | PENDING até approve; produtos bloqueados | e2e partner | UX cadastro |

### Fase 2 — operação mínima

| Tarefa | Arquivo | Aceite | Teste |
| ------ | ------- | ------ | ----- |
| Unificar carrinho | product/service detail → `/api/cart` | um único cart | e2e add→checkout |
| E-mail verify ou remover claim | auth + mail templates | comportamento honesto | register flow |
| Alinhar redirects/testes | `dashboard.ts`, ngo nav, tests | `npm run test` verde | test suite |
| type-check com generate | `package.json` scripts | type-check pós-ci limpo | CI |

### Fase 3 — homologação

| Tarefa | Aceite | Teste |
| ------ | ------ | ----- |
| Credenciais sandbox MP + webhook Preview | pagamento teste end-to-end | E2E payment sandbox |
| Resend domínio verificado | recovery/welcome | `test:mail` / admin test-email |
| Cloudinary prod-like | upload cadastro | `test:cloudinary` + manual |
| TalkJS test mode | chat | foundation talkjs |
| Desabilitar rotas Stripe stub | 404/410 | security scan |

### Fase 4 — piloto

| Tarefa | Aceite |
| ------ | ------ |
| Fee/snapshot/ledger mínimo | pedido guarda % e valores |
| Split MP ou payout manual operacional | parceiro recebe valor correto |
| Observabilidade Better Stack | alertas erro/webhook |
| Rate-limit HTTP fechado | suite security completa |
| Piloto com N parceiros/clientes reais controlados | runbook + rollback |

### Fase 5 — produção

| Tarefa | Aceite |
| ------ | ------ |
| MP Live + webhook secret + reconciliação diária | dinheiro real reconciliado |
| KYC obrigatório | zero parceiro ACTIVE sem approve |
| LGPD operacional (DPO, retenção) | checklist legal |
| Remover flags perigosas | `validate-production-env` limpo |
| Load/smoke produção | SLOs acordados |

---

## 17. Checklist de lançamento

```text
[OK]      npm ci
[OK]      npm run lint
[FALHA]   npm run type-check sem db:generate prévio
[OK]      npm run type-check após db:generate
[OK]      npm run build
[FALHA]   npm run test (client-experience + ngo-experience)
[OK]      prisma validate
[OK]      migrate status neste workspace (27 locais)
[FALHA]   migrations completas versionadas no Git (7/27)
[OK]      Auth login/register Next (código + testes parciais)
[FALHA]   Confirmação de e-mail
[PENDENTE] Deploy Vercel Preview validado nesta auditoria
[PENDENTE] Webhook MP Live/sandbox E2E
[FALHA]   Split/repasse comercial
[FALHA]   Stripe pronto
[OK]      Social core Next
[PARCIAL] Pets (Next OK / Express dep. infra)
[PENDENTE] AI com OPENAI em homolog
[OK]      NGO flows Prisma (14/14)
[FALHA]   Express simulação pagamento removida
[PENDENTE] Secrets Production auditados no painel Vercel
[NÃO TESTADO] Pagamento real
[NÃO TESTADO] Carga / Lighthouse produção
[NÃO TESTADO] Backup/restore Production
```

---

## 18. Variáveis — checklist operacional (sem valores)

### Obrigatórias Production (mínimo abrir + auth)

- `DATABASE_URL`, `DIRECT_URL`
- `AUTH_SECRET`, `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`, `APP_URL`, `NEXT_PUBLIC_APP_URL` (HTTPS canônico)

### Recomendadas Production (cadastro completo)

- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_PROVIDER=resend`, `EMAIL_DOMAIN_VERIFIED=true`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `UPLOAD_DEV_FALLBACK=0`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_ENABLED=true`

### Para cobrar (homolog/prod)

- `PAYMENT_PROVIDER=mercado_pago`
- `MERCADO_PAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`
- `MERCADO_PAGO_ENVIRONMENT=test|production`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- Webhook URL pública `https://<domínio>/api/webhooks/mercado-pago`

### Explicitamente NÃO publicar

- Flags de teste OTP / bypass Turnstile / insecure cookie / `UPLOAD_DEV_FALLBACK=1`

---

## 19. Veredito

```text
PODE SER HOMOLOGADO
```

### Justificativa com evidências

1. **Build e lint passam** (`npm run build` EXIT 0; lint limpo) — a aplicação Next é implantável como artefato.
2. **Backend real existe** (~393 Route Handlers + Prisma 216 models + DB Supabase sincronizado neste workspace).
3. **Fluxos core não-financeiros** (register/login, catálogo, cart API, checkout pedido, partner products, ong adoption, admin lists, social) têm caminho Next→Prisma verificável; vários cobertos por testes foundation/e2e/código.
4. **Porém bloqueadores impedem publicação comercial:**
   - migrations majoritariamente **fora do Git**;
   - pagamentos sem split/ledger e ambiente com provider desligado;
   - simulação Express `sim_*`;
   - hybrid Express sem deploy;
   - aprovação parceiro não-gate;
   - suite `npm run test` vermelha em experiência CLIENT/ONG.
5. Portanto: **homologação técnica/sandbox é o máximo responsável agora**.  
   **Não** classificar como piloto financeiro nem produção comercial até Fase 1–4.

### Pareceres anteriores

O documento `docs/release/final-audit-report.md` (“APROVADO PARA PRODUÇÃO COM RESSALVAS”) **não deve ser usado** como base de go-live: conflita com o estado atual do Git (migrations) e com as lacunas financeiras/Express verificadas nesta auditoria.

---

## 20. Próximo passo sugerido (sem executar correções)

1. Corrigir `.gitignore` e versionar as 20 migrations faltantes (**B01**).  
2. Decidir: matar Express em prod ou hospedá-lo (**B04**).  
3. Remover simulação de pagamento (**B03**).  
4. Só então ligar Mercado Pago sandbox e rodar E2E de pagamento + webhook.

---

*Fim do relatório. Nenhuma correção silenciosa foi aplicada ao repositório durante esta auditoria.*
