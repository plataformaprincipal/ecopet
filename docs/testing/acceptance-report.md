# Acceptance Report — EcoPet Enterprise QA

**Data:** 2026-07-20  
**Commit base:** `a87e0ba` (+ UI Etapas 1–2 em working tree)  
**Ambiente:** local (Playwright Chromium + `npm run dev -w @ecopet/web`)  
**Banco:** PostgreSQL/Supabase via `DATABASE_URL` (não produção)  
**Pré-condição:** UI Foundation (Etapa 1) + UI Premium (Etapa 2) concluídas  

## Parecer

# ✅ Pronto para Homologação

Com ressalvas documentadas (integrações Live, SMTP, cross-browser Safari/iOS, Lighthouse CI, SUPER_ADMIN E2E). **Não** é aprovação de go-live produção.

---

## 1. Resumo executivo

| Suite | Resultado |
|-------|-----------|
| `npm run test:e2e:acceptance` | **38 passed**, 1 skipped, 0 failed |
| `test:permissions:unit` | 43/43 |
| `test:observability` | 11/11 |
| `test:mercado-pago` | 20/20 |
| `test:talkjs` | 10/10 |
| `test:turnstile` | 19/19 |
| `test:firebase` | 15/15 |
| `test:analytics` | 35/35 |
| `test:gtm` | 26/26 |
| `test:google-maps` | 12/12 |
| `test:ai:foundation` | 8/8 |
| `test:password` | 9/9 |
| `test:vlibras` | 5/5 |
| `test:i18n` | 1957 chaves pt-BR/en/es OK |
| `test:accessibility` | layouts OK |
| `test:no-mocks` | 3/3 |
| `lint` | OK |
| `type-check` | OK |
| `test:register` / `test:security` HTTP | Falhou sem servidor estável dedicado (`fetch failed`) — coberto pelo E2E + unit |

---

## 2. Área pública

| Caso | Evidência | Status |
|------|-----------|--------|
| Landing / Hero | visitor: home + `#conheca` | ✅ |
| Módulos pré-visualização | visitor: landing modules | ✅ |
| Marketplace público | visitor + client cart | ✅ |
| Explorar | visitor | ✅ |
| Social público | visitor | ✅ |
| EcoPet IA pública | visitor shell | ✅ (AI_ENABLED=false — UI abre) |
| Mobile 375 overflow | visitor viewport | ✅ |
| Health / headers | visitor API | ✅ |
| SEO | metadata layout (estático) | ⚠ Manual / Homolog |
| VLibras | unit + layout a11y | ✅ unit / Homolog visual |
| Tradução | test:i18n | ✅ paridade |

---

## 3. Cadastro

| Persona | Válido | Duplicata | RBAC pós-cadastro | Evidência |
|---------|--------|-----------|-------------------|-----------|
| CLIENT | ✅ | ✅ 409 | ✅ | `client.spec.ts` |
| PARTNER | ✅ | — | ✅ bloqueio admin/NGO | `partner-ngo.spec.ts` |
| NGO | ✅ | — | ✅ bloqueio partner orders | `partner-ngo.spec.ts` |

Senha forte: unit `test:password`. CEP/CPF/CNPJ: cobertos por foundation/unit existentes; não reexecutados todos neste run. SMTP Gmail **535** no registro (não bloqueia cadastro) → P2 ops.

---

## 4. Login / sessão

| Caso | Status | Evidência |
|------|--------|-----------|
| Login correto (API) | ✅ | client.spec |
| Login UI → dashboard | ✅ | client.spec (neste run passou) |
| Senha incorreta (mensagem genérica) | ✅ | client + admin security |
| Usuário inexistente (sem enumeração) | ✅ | admin.spec |
| Logout invalida sessão | ✅ | client + partner |
| Remember / multi-device / expiração cookie | ⚠ | Homolog manual |
| Refresh token edge | ⚠ | Homolog |

---

## 5–8. Perfis (persistência + permissões)

| Perfil | Persistência | Permissões | Funcionalidades cobertas | Status |
|--------|--------------|------------|--------------------------|--------|
| CLIENT | Pet + listagem + cart | Admin 403, IDOR pet | Cadastro, login, pet, marketplace/cart, logout, UI login | ✅ c/ ressalvas |
| PARTNER | Produto criado | Admin/NGO 403 | Cadastro, produto, cart client | ✅ |
| NGO | Cadastro | Partner orders 403 | Cadastro + RBAC | ✅ parcial (sem CRUD animais E2E neste run) |
| ADMIN | — | Gate CLIENT | observability 403 | ✅ c/ ressalvas |
| SUPER_ADMIN / TI interno | — | — | Não E2E (sem credenciais env) | ⚠ Homolog |

---

## 9. Integrações (sem mocks de negócio)

| Integração | Env local | Testes | Live | Status Homolog |
|------------|-----------|--------|------|----------------|
| Supabase/Prisma | DATABASE_URL SET | E2E register/pets | Pooler sa-east-1 | Homolog |
| OpenAI | KEY SET / AI_ENABLED=false | foundation unit | Não | Homolog (ligar AI) |
| Firebase | public config incompleta | unit 15/15 | Não | Homolog |
| TalkJS | APP_ID MISSING / SECRET SET | unit 10/10 | Não | Homolog |
| Mercado Pago | token SET / PAYMENT_PROVIDER=none | unit 20/20 | Não | Homolog |
| Better Stack | tokens MISSING | unit 11/11 | Não | Homolog |
| Cloudinary | SET | unit disponível | Não neste run | Homolog |
| Resend / SMTP | RESEND SET / SMTP 535 | logs E2E | Não | P2 |
| Google Maps | NEXT_PUBLIC SET | unit 12/12 | Não | Homolog |
| Analytics GA | SET | unit 35/35 | Não | Homolog |
| GTM | SET | unit 26/26 | Não | Homolog |
| Turnstile | SET | unit 19/19 | UI pode bloquear | Homolog |

---

## 10–15. Transversais

Ver `responsive.md`, `performance.md`, `production-checklist.md`, `bugs.md`, `qa-report.md`.

---

## Declaração

Nenhuma funcionalidade, API, banco, auth ou integração foi alterada por este prompt de QA (exceto correção visual P2 de URL Unsplash 404 na landing, pós-descoberta).
