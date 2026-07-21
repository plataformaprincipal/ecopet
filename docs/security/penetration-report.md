# Penetration / Security Test Report — EcoPet

**Data:** 2026-07-20  
**Tipo:** Auditoria híbrida (static + unit + tentativa dinâmica HTTP)  
**Ambiente:** local Windows · Next.js 15 · Prisma/Supabase  
**Não destrutivo:** sem alteração de funcionalidades

---

## 1. Metodologia

1. Revisão de código e docs existentes (`docs/security/*`, `docs/production/security.md`).  
2. Suites unitárias de segurança (RBAC, MP, TalkJS, Turnstile, Firebase, AI firewall, observability).  
3. Tentativa de execução `npm run test:server:start` + `WEB_URL=http://127.0.0.1:3002 npm run test:security`.  
4. `npm audit --omit=dev`.  
5. lint / type-check.  
6. Correlação com acceptance E2E (Prompt 3).

---

## 2. Resultados por vetor

### 2.1 Autenticação

| Teste | Resultado | Notas |
|-------|-----------|-------|
| Cookie flags | Pass (código) | httpOnly, SameSite=Lax, Secure HTTPS |
| Session insecure force em prod | Pass | Ignorado em produção |
| Rate limit disable em prod | Pass | Bloqueado |
| Login enumeration | Pass | Mensagens unificadas |
| Suite HTTP register/login/logout | **Bloqueado** | `register CLIENT 500`; health/home 500 no servidor estável |

### 2.2 Autorização / IDOR / privilégio

| Teste | Resultado |
|-------|-----------|
| Path RBAC por role (unit) | **43/43 Pass** |
| IDOR pets/orders/messages (HTTP script) | **Não concluído** (servidor) |
| Admin API sem sessão | Coberto por E2E/foundation históricos + middleware |
| Escalada CLIENT→ADMIN | Não observada em unit paths |

### 2.3 Injection / XSS / Path

| Vetor | Resultado |
|-------|-----------|
| SQL injection via Prisma | Pass (static) |
| Command injection | Pass (static) |
| Path traversal upload | Pass (código local-dev + constraints) |
| XSS stored via SVG upload | Pass — SVG na denylist |
| XSS refletido | Pass parcial — depende CSP |

### 2.4 CSRF / Clickjacking / Open Redirect

| Vetor | Resultado |
|-------|-----------|
| CSRF cross-site cookie | Mitigado SameSite=Lax; sem CSRF token |
| Clickjacking | Headers OK |
| Open redirect push/notif | Pass (unit Firebase) |

### 2.5 Uploads

| Payload | Esperado | Status |
|---------|----------|--------|
| EXE / PHP / JS / HTML / SVG | Bloqueado por extensão/MIME | Pass (código) |
| Oversized | Rejeitado por MAX_BYTES | Pass |
| Sem auth | 401 | Foundation integrations |
| Malware scanning AV | Não implementado | Gap informativo |

### 2.6 Mercado Pago

| Ataque | Resultado |
|--------|-----------|
| Webhook sem secret (prod) | 503 fail-closed |
| Assinatura inválida | Rejeitado |
| Replay / skew | Rejeitado |
| Duplicidade | Idempotência |
| Leak de token em status | Sanitizado (unit) |

### 2.7 OpenAI

| Ataque | Resultado |
|--------|-----------|
| Jailbreak / ignore instructions | Bloqueado (unit) |
| Exfil de secrets | Bloqueado |
| Indirect HTML/script | Categoria indirect_injection |
| Token exposure client | Não encontrado |

### 2.8 TalkJS / Firebase

| Ataque | Resultado |
|--------|-----------|
| Webhook sem HMAC (strict) | Rejeitado |
| Persona CLIENT↔CLIENT | Bloqueado |
| Push URL externa | Bloqueado |

---

## 3. Achados dinâmicos desta rodada

| ID | Achado | Severidade | Status |
|----|--------|------------|--------|
| PEN-01 | Servidor estável `next start :3002` respondeu 500 em `/` e `/api/health` após build | Alta (ops/evidência) | Impede pentest HTTP |
| PEN-02 | `test:security` → `register CLIENT 500 {}` | Alta (ops) | Reexecutar em staging saudável |
| PEN-03 | `npm audit` 5 High transitivas | Alta (deps) | Ver `dependencies-report.md` |

Nenhum exploit de bypass de autenticação ou webhook financeiro foi confirmado.

---

## 4. Cobertura vs. alvos do prompt

| Alvo | Cobertura |
|------|-----------|
| JWT/Cookies/Session/Refresh/Logout/Remember | Código + unit parcial |
| Session Fixation | Análise estática — mitigado |
| RBAC todos os papéis | Unit completo |
| IDOR todos os IDs | Estático + parcial; dinâmico incompleto |
| OWASP + extras | Mapeado em `owasp-report.md` |
| Upload Cloudinary | Estático + constraints |
| Prisma/Supabase | Estático |
| MP webhook fraude/replay | Unit completo |
| Firebase/TalkJS/OpenAI/Better Stack | Unit + config gaps |
| LGPD | Ver `lgpd-report.md` |

---

## 5. Recomendação de reteste

Antes do go-live:

```bash
npm run test:server:start
# confirmar GET /api/health == 200
set WEB_URL=http://127.0.0.1:3002
npm run test:security
npm run test:e2e:acceptance
```

Em staging Vercel Preview: repetir headers (curl -I), webhook MP sandbox, TalkJS Live, Turnstile enforced.
