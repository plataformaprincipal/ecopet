# Security Report — EcoPet (Enterprise / OWASP + Hardening)

**Data:** 2026-07-20  
**Papéis:** Security Engineer · Pentester · DevSecOps · Cloud Security · OWASP  
**Escopo:** autenticação, autorização/RBAC/IDOR, OWASP Top 10, uploads, Prisma/Supabase, Mercado Pago, Firebase, TalkJS, OpenAI, Better Stack, LGPD, dependências, headers/infra  
**Restrição:** auditoria sem alteração de funcionalidades  
**Documentos relacionados:** `owasp-report.md`, `penetration-report.md`, `lgpd-report.md`, `headers-report.md`, `dependencies-report.md`, `risk-matrix.md`

---

## Parecer final

# ❌ NÃO APROVADO PARA PRODUÇÃO

# ✅ APROVADO PARA HOMOLOGAÇÃO (com hardening já presente no código)

Critérios de produção **não** atendidos integralmente: há vulnerabilidades **High** em dependências transitivas (`npm audit --omit=dev`), suite HTTP `test:security` não concluiu no servidor estável desta rodada, integrações Live incompletas no ambiente local (TalkJS APP_ID, Firebase público, Better Stack, `PAYMENT_PROVIDER=none`), e itens LGPD operacionais ainda **MANUAL** (retenção/DPO).

Não há vulnerabilidades **Critical** identificadas no código de aplicação para bypass de auth, webhook MP sem assinatura em produção, ou exposição direta de secrets em respostas de health.

---

## 1. Resumo executivo

| Área | Avaliação | Evidência |
|------|-----------|-----------|
| Autenticação (cookie session) | Íntegra no código | `auth-session.ts` httpOnly + SameSite=Lax + Secure em HTTPS; `FORCE_INSECURE_SESSION_COOKIE` ignorado em prod |
| RBAC | Íntegro (unit) | `test:permissions:unit` **43/43** |
| IDOR | Controles presentes; HTTP live incompleto | Ownership em pets/orders/messages; `test:security` falhou (register 500 / servidor estável instável) |
| Mercado Pago webhooks | Protegido no código | Assinatura + replay skew + idempotência; fail-closed sem secret em produção — **20/20** testes |
| Uploads | Hardening sólido | MIME/tamanho/extensão; SVG/EXE/PHP/JS bloqueados |
| OpenAI / prompt injection | Controles unitários OK | `test:ai:enterprise` **8/8** (firewall) |
| TalkJS | HMAC/persona OK | **10/10**; config Live incompleta no env local |
| Firebase push | Safe URL + redact | **15/15** |
| Observabilidade / PII | Redação + correlation id | **11/11** |
| Headers / CSP | Presentes; CSP permissivo | `unsafe-inline` / `unsafe-eval` (VLibras/TalkJS) |
| Dependências | **5 High**, 0 Critical | `npm audit --omit=dev` → 15 total |
| LGPD (escopo código) | Parcialmente atendida | Export/consent/revoke; retenção e DPO MANUAL |
| lint / type-check | OK | lint limpo; type-check database+web+api |
| Acceptance E2E | Homologação | Prompt 3: **38 passed**, 1 skipped |

---

## 2. Autenticação

| Controle | Status | Notas |
|----------|--------|-------|
| Session cookie `ecopet-session` | ✅ | httpOnly, SameSite=Lax, Secure em HTTPS/Vercel |
| JWT em cookie legível pelo JS | ✅ N/A | Sessão server-side; não expõe token em `document.cookie` |
| Refresh / Remember | ✅ Código | Flags e TTLs no módulo de sessão; sem evidência de token refresh frágil em localStorage |
| Logout | ✅ | Cookie invalidado (Max-Age=0 nos testes de segurança) |
| Session fixation | ✅ Mitigado | Novo cookie pós-login; não reutiliza ID de anônimo sem reauth |
| Rate limit auth | ✅ | Produção bloqueia `AUTH_RATE_LIMIT_DISABLED` / RELAXED |
| Enumeração de conta | ✅ | Mensagens unificadas no login |
| OTP / rotas de teste | ✅ | Bloqueadas em produção |

**Lacuna:** suite HTTP completa de auth/IDOR não fechou nesta rodada (servidor `test:server:start` retornou 500 em `/` e `/api/health` após boot). Controles cobertos por unit + E2E de aceitação (Prompt 3).

---

## 3. Autorização / RBAC / IDOR

Matriz estática: `docs/security/rbac-matrix.md`.

| Persona | Isolamento | Evidência |
|---------|------------|-----------|
| CLIENT | Dashboard/client; sem admin/partner/ngo | 43 unit paths |
| PARTNER | `/partner/*`; sem client/ngo/gestor | 43 unit paths |
| NGO/ONG | `/ngo/*` | 43 unit paths |
| ADMIN | `/admin`, `/gestor`; sem marketplace client | 43 unit paths |
| Ownership pets/orders | Filtro `ownerId` / `userId` | Código + matriz RBAC |
| Messages | Membership / persona TalkJS | `assertPersonaCanMessage` |
| Escalada de privilégio | Middleware + API role checks | Sem bypass encontrado em review estático |

**IDs revisados (padrão ownership / role):** users, pets, orders, products, services, campaigns, messages, notifications, posts, comments, reports, tickets — controles por rota; **não** houve prova dinâmica IDOR completa nesta sessão.

---

## 4. Integrações críticas

### Mercado Pago
- Assinatura `x-signature` + `x-request-id`
- Replay / skew rejeitado
- Idempotência de eventos
- Fail-closed sem webhook secret em `NODE_ENV=production`
- Payload sanitizado (sem cartão/token nos testes)
- **Risco residual:** ambiente local com `PAYMENT_PROVIDER=none` — go-live exige secret + Live smoke

### Firebase
- Tokens FCM com classificação de erro permanente/transiente
- Open redirect bloqueado em URLs de notificação
- Config pública sem private key no client

### TalkJS
- HMAC em webhook (strict)
- Persona messaging rules
- Health sem secrets

### OpenAI
- Prompt firewall (injection, jailbreak, leakage, indirect)
- Rate limit de endpoint
- Sem exposição de API key em health/client

### Better Stack
- Config exige token+host; redaction de PII/secrets
- **Gap ops:** tokens ausentes no env local auditado

### Cloudinary / Upload
- Auth obrigatória, purpose whitelist, MIME/size/ext
- Bloqueio: svg, exe, php, js, html, zip perigosos via `DANGEROUS_EXTENSIONS`
- Produção sem provider → `UPLOAD_NOT_CONFIGURED`

---

## 5. Banco (Prisma / Supabase)

| Tema | Avaliação |
|------|-----------|
| SQL raw inseguro | Sem `$queryRawUnsafe` no app TS auditado |
| ORM parametrizado | Prisma padrão |
| FK / cascade | Schema Prisma; deletes sensíveis via serviços |
| Transactions | Usadas em fluxos financeiros/críticos |
| Secrets no client | `DATABASE_URL` server-only |

---

## 6. Critérios de “APROVADO PARA PRODUÇÃO”

| Critério | Resultado |
|----------|-----------|
| Sem vulnerabilidades críticas (app) | ✅ 0 Critical encontradas |
| Sem falhas P0 | ❌ Gaps Live + suite HTTP segurança + deps High |
| Autenticação íntegra | ⚠ Código OK; prova HTTP live incompleta |
| RBAC íntegro | ✅ Unit 43/43 |
| Pagamentos protegidos | ⚠ Código OK; Live/provider incompleto |
| Integrações seguras | ⚠ Código OK; config incompleta |
| LGPD no escopo implementado | ⚠ Código OK; retenção/DPO MANUAL |
| build / lint / type-check | ✅ |
| Testes de aceitação | ✅ Homologação (Prompt 3) — não go-live |

---

## 7. Ações bloqueadoras para produção (P0/P1)

1. **P0** — Resolver `npm audit` High relevantes ou aceitar risco formal com mitigação (ws/socket.io, form-data, nodemailer/next-auth).  
2. **P0** — Fechar `test:security` HTTP verde em staging (IDOR + rate limit + headers).  
3. **P0** — Mercado Pago Live: webhook secret, provider ativo, smoke de pagamento + replay.  
4. **P1** — TalkJS / Firebase / Turnstile / Better Stack com secrets de produção e smoke.  
5. **P1** — Política de retenção LGPD operacional + evidência DPO.  
6. **P1** — Plano CSP: reduzir `unsafe-eval` / migrar nonces quando VLibras permitir.

---

## 8. Comandos de evidência (esta rodada)

```bash
npm run lint                          # OK
npm run type-check                    # OK
npm run test:permissions:unit         # 43/43
npm run test:mercado-pago             # 20/20
npm run test:ai:enterprise -w @ecopet/web   # 8/8
npm run test:talkjs -w @ecopet/web          # 10/10
npm run test:turnstile -w @ecopet/web       # 19/19
npm run test:firebase -w @ecopet/web        # 15/15
npm run test:observability -w @ecopet/web   # 11/11
npm audit --omit=dev                  # 0 critical, 5 high, 9 moderate, 1 low
npm run test:security                 # FALHOU (servidor estável 500 / register 500)
```

Acceptance E2E: ver `docs/testing/acceptance-report.md` (Prompt 3).
