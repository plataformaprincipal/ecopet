# Relatório final — Testes de aceitação por perfil

**Data:** 2026-07-20  
**Commit:** `a87e0ba`  
**Ambiente:** local (Playwright + Next.js webServer)  
**Banco:** PostgreSQL local/Supabase via `.env` (não produção)  
**Parecer:** **APROVADO PARA HOMOLOGAÇÃO**

---

## 1. Resumo executivo

Foi criada e executada uma suíte de aceitação automatizada por perfil (Playwright) mais roteiros manuais e correção de regressão em `test:permissions` (dashboard CLIENT → `/cliente`).

| Suite | Resultado |
|---|---|
| `npx playwright test e2e/acceptance` | **34 passed**, 1 skipped, 0 failed |
| `test:observability` | 11/11 |
| `test:mercado-pago` | 20/20 |
| `test:permissions:unit` | 43/43 (após correção `/cliente`) |
| `lint` | OK |
| `type-check` (@ecopet/web) | OK |

**Não** foram executados: Preview Vercel, TalkJS Live, Mercado Pago Live, pagamento real, smoke produção, E2E SUPER_ADMIN completo, carga.

---

## 2–7. Ambiente / versão / banco / integrações / dados

- Framework: **Playwright** (já no monorepo) + scripts Node unitários existentes  
- Dados: e-mails `*@test.ecopet.local`, senha forte sintética, CNPJ sintético  
- Limpeza: `ACCEPTANCE_CLEANUP=1 npm run test:acceptance:cleanup`  
- Integrações no run: DB real local; e-mail SMTP Gmail falhou (535) sem bloquear cadastro; MP/TalkJS Live **não** usados  
- Better Stack: logs estruturados de login_failed observados no webServer (correlationId presente)

---

## 8–13. Perfis (evidência automatizada)

| Perfil | Evidência | Status |
|---|---|---|
| VISITOR | `visitor.spec.ts` — home, marketplace, explorar, login/cadastro/recuperar, admin gate, API 401, health, headers | **Aprovado** (local) |
| CLIENT | `client.spec.ts` — cadastro, duplicata, login, senha inválida, admin 403, pet, listagem, IDOR, logout; UI login skipped (Turnstile) | **Aprovado com ressalvas** |
| PARTNER | `partner-ngo.spec.ts` — cadastro, produto, RBAC | **Aprovado** (local) |
| NGO | cadastro + bloqueio partner orders/admin | **Aprovado** (local) |
| ADMIN | `admin-gates.spec.ts` — CLIENT bloqueado; ADMIN real skipped sem env | **Aprovado com ressalvas** |
| SUPER_ADMIN / TI | Só roteiro manual | **Não executado** |

---

## 14–28. Áreas transversais

| Área | Status | Nota |
|---|---|---|
| Autenticação | Aprovado c/ ressalvas | API OK; UI login depende Turnstile |
| Permissões / IDOR | Aprovado c/ ressalvas | Pet IDOR coberto; matriz IDOR completa manual |
| Marketplace / pedido | Parcial | Carrinho OK; checkout foundation já existia; sem pagamento Live |
| Pagamentos | Bloqueado Live | Unit MP sandbox OK |
| TalkJS | Bloqueado Live | Test Mode / unit |
| OpenAI | Não executado E2E | Unit AI disponível |
| Firebase / Cloudinary / Resend | Parcial | SMTP local quebrado (535) |
| Better Stack | Parcial | Logs no console webServer; evento admin não neste run |
| Notificações / automações | Parcial | Foundation / manuais |
| Segurança | Parcial | Headers, RBAC, IDOR; XSS/CSRF manuais |
| A11y / i18n / responsivo | Manual / unit | `test:vlibras`, roteiros |
| Performance / carga | Não executado | — |
| Concorrência | Não executado | — |
| Preview / produção smoke | Não executado | — |

---

## 34–36. Tabelas

### Por perfil

| Perfil | Cadastro | Login | Permissões | Funcionalidades | Integrações | Segurança | Acessibilidade | E2E | Status |
|---|---|---|---|---|---|---|---|---|---|
| VISITOR | N/A | Forms abrem | API 401 | Público OK | — | Headers | Manual | 9/9 | Aprovado |
| CLIENT | OK | API OK / UI skip | Admin 403 | Pet+IDOR | SMTP falha | Parcial | Manual | OK+skip | Aprovado c/ ressalvas |
| PARTNER | OK | OK | Admin/NGO 403 | Produto+cart | — | Ownership | Manual | OK | Aprovado |
| NGO | OK | OK | Partner 403 | — | — | RBAC | Manual | OK | Aprovado |
| ADMIN | Env opcional | — | Gate OK | Obs blocked | — | Gate | Manual | Parcial | Aprovado c/ ressalvas |
| SUPER_ADMIN | — | — | — | — | — | — | — | Não exec. | Não executado |

### Defeitos / achados

| ID | Severidade | Perfil | Módulo | Problema | Evidência | Correção | Status |
|---|---|---|---|---|---|---|---|
| DEF-01 | Média | — | Permissions test | Expectativa `/client` vs código `/cliente` | `test-permissions.mjs` | Teste alinhado a `/cliente` | Corrigido |
| DEF-02 | Baixa | CLIENT | Login UI | Submit desabilitado (Turnstile/risco) | Playwright skip | Homologar com Turnstile test keys | Aberto |
| DEF-03 | Média | ALL | E-mail | SMTP Gmail 535 no cadastro | Logs webServer | Usar Resend em Preview | Aberto |
| DEF-04 | Alta (prod) | ALL | Pagamento/TalkJS Live | Não validados | Escopo | Homologação com credenciais | Aberto |
| DEF-05 | Info | ALL | Rate limit | 429 em sequência de logins | E2E anterior | `AUTH_RATE_LIMIT_RELAXED` em test | Mitigado em CI local |

---

## 37. Parecer final

# APROVADO PARA HOMOLOGAÇÃO

**Justificativa:** E2E de aceitação crítica por perfil passou localmente (34/35 com 1 skip justificado); lint/type-check/unitários de permissões/MP/observability OK. Faltam Preview, Live payments/messaging, SUPER_ADMIN, smoke produção e a11y formal — impedem parecer de produção.

---

## 38. Plano de correção

**P0**
1. Homologar Preview com Resend (não SMTP Gmail quebrado)  
2. Validar Turnstile em cadastro/login UI  
3. Matriz IDOR completa em CI com `WEB_URL`

**P1**
1. ADMIN_TEST_* no CI para observability  
2. TalkJS Test webhooks + MP sandbox E2E checkout  
3. Roteiros manuais SUPER_ADMIN  

**P2**
1. A11y automatizado axe  
2. Carga controlada  

**P3**
1. Produção controlada pagamento mínimo (com autorização)

---

## Comandos

```bash
npm run test:e2e:acceptance
npm run test:permissions:unit
npm run test:observability -w @ecopet/web
npm run test:mercado-pago -w @ecopet/web
npm run lint
npm run type-check -w @ecopet/web
ACCEPTANCE_CLEANUP=1 npm run test:acceptance:cleanup
```

Índice: [README.md](./README.md)
