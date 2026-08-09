# FASE 4.1 — Inventário de Production

**Data:** 2026-08-09  
**Fonte:** Vercel CLI `env ls` / `project ls`, DNS HTTP probe, código, docs prévias  
**Regra:** sem secrets; sem alteração Production

---

## Vercel

| Campo | Valor |
| ----- | ----- |
| Team / scope | `ecopet-s-projects` |
| Projeto app | `ecopet-web` (`prj_s0bPVSphC7jzVfodZswqxQ3nyL4u`) |
| Projeto root link | `ecopet_github` (não usar para deploy web) |
| Latest Production URL | `https://www.eccopet.com` |
| Node | 24.x |
| Region (`vercel.json`) | `gru1` |
| Install / Build | monorepo root `npm ci` / `npm run build` |
| Framework | Next.js |
| Deployment Protection | ativa em Preview (bypass necessário); Production pública no domínio |
| Root directory efetivo | monorepo via comandos `cd ../..` |

### Env Production (presença — valores ocultos)

**Presentes Production:**  
`DATABASE_URL`, `DIRECT_URL`, `MERCADO_PAGO_WEBHOOK_SECRET`,  
`AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL`, `NEXT_PUBLIC_APP_URL`,  
`WEB_URL`, `PAYMENT_PROVIDER`, `EMAIL_*` / SMTP / Resend, Turnstile keys, Cloudinary, Firebase, TalkJS, Better Stack, OpenAI, GTM/GA, etc. (muitos marcados Preview+Production).

**Ausentes Production (crítico):**  
`MERCADO_PAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_ENVIRONMENT`,  
flags `FINANCIAL_*` / `PAYOUTS_*` / `RESERVE_*` / `CHARGEBACKS_*` / `DAILY_RECONCILIATION_*`.

**Preview-only (correto manter fora de Production):**  
`E2E_TEST_MODE`, `E2E_TEST_SECRET`, `TURNSTILE_ALLOW_CLOUDFLARE_TEST_KEYS`, `ALLOW_SIMULATED_PAYMENTS`,  
token/public key MP de teste, flags financeiras Preview.

---

## Supabase / Postgres

| Campo | Estado |
| ----- | ------ |
| Homolog | `eccopet-homolog` / pooler `aws-0-sa-east-1` (usado em Preview) |
| Production project | `DATABASE_URL` Production existe — **mapear project ref no dashboard** (não feito nesta sessão) |
| Region | sa-east-1 (homolog confirmado; Production a confirmar) |
| Pooler / Direct | ambos presentes Preview e Production |
| Migrations Git | 29 |
| Migrations DB Production | **não auditadas** (sem conexão RO autorizada nesta sessão) |
| Backup / PITR | ver `FASE_3_5_BACKUP_RESTORE_DRILL.md` — drill isolado **aberto** |
| Auth Supabase | app usa NextAuth próprio (não Auth Supabase como IdP principal) |
| Storage | Cloudinary (upload), não Storage Supabase como primário |

---

## Mercado Pago

| Campo | Preview | Production |
| ----- | ------- | ---------- |
| Access Token | presente (TEST/`APP_USR`) | **AUSENTE no env** |
| Public Key | presente | **AUSENTE no env** |
| Webhook secret | presente | presente |
| Environment var | `test` (Preview) | **AUSENTE** |
| Webhook natural | chega; **SIGNATURE_MISMATCH** | URL Production ainda não comprovada |
| Conta recebedora / settlement | n/a sandbox | **a validar no painel** antes de qualquer cobrança |
| Refunds / chargebacks | testados em sandbox (interno) | não comprovados live |

---

## DNS / TLS

| Host | Observação |
| ---- | ---------- |
| `https://eccopet.com` | **308** (redirect) |
| `https://www.eccopet.com` | **200** (canônico atual) |
| `https://homolog.eccopet.com` | Preview alias `ecopet-web` |
| Provider / TTL | não enumerado via API DNS nesta sessão — confirmar no registrador |

---

## 4.2 Matriz Preview × Production

| VARIÁVEL | PREVIEW | PRODUCTION | IGUAL? | DIFERENTE? | RISCO |
| -------- | ------- | ---------- | ------ | ---------- | ----- |
| DATABASE_URL | set | set | **NÃO** (deve) | **SIM** | CRITICAL se compartilhar |
| DIRECT_URL | set | set | **NÃO** | **SIM** | CRITICAL se compartilhar |
| NEXTAUTH_URL | set (shared tag) | set (shared tag) | **AUDITOR** | preferível distinto | HIGH se homolog em prod |
| NEXTAUTH_SECRET | shared tag | shared tag | **AUDITOR** | preferível distinto | HIGH (blast radius) |
| AUTH_SECRET | shared tag | shared tag | **AUDITOR** | preferível distinto | HIGH |
| APP_URL | shared tag | shared tag | **AUDITOR** | **SIM** (domínio) | HIGH |
| NEXT_PUBLIC_APP_URL | shared tag | shared tag | **AUDITOR** | **SIM** | HIGH |
| WEB_URL | shared tag | shared tag | **AUDITOR** | **SIM** | HIGH |
| MERCADO_PAGO_ACCESS_TOKEN | set TEST | **MISSING** | n/a | **SIM** (prod real) | CRITICAL |
| NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY | set TEST | **MISSING** | n/a | **SIM** | CRITICAL |
| MERCADO_PAGO_WEBHOOK_SECRET | set | set | **NÃO** (deve) | **SIM** | CRITICAL se igual TEST |
| MERCADO_PAGO_ENVIRONMENT | test | **MISSING** | n/a | deve ser `production` | CRITICAL |
| ALLOW_SIMULATED_PAYMENTS | Preview only | ausente | OK | — | OK |
| FINANCIAL_LEDGER_ENABLED | set | unset→off | — | ligar explícito | HIGH |
| PAYOUTS_ENABLED | set | unset→off | — | manter false | OK conservador |
| MANUAL_PAYOUT_APPROVAL_REQUIRED | set | unset | — | true explícito | MEDIUM |
| RESERVE_ENABLED | set | unset→off | — | true explícito | MEDIUM |
| CHARGEBACKS_ENABLED | set | unset→off | — | true explícito | MEDIUM |
| DAILY_RECONCILIATION_ENABLED | set | unset | — | true piloto | MEDIUM |
| E2E_TEST_MODE / SECRET | Preview | ausente | OK | — | OK |
| TURNSTILE_ALLOW_CLOUDFLARE_TEST_KEYS | Preview | ausente | OK | — | OK |
| Turnstile site/secret | shared tag | shared tag | **AUDITOR** | prod keys reais | HIGH se test keys |
| Vercel bypass | Preview ops | **não** | — | ausente prod | OK |

### Regras (status)

| Regra | Status |
| ----- | ------ |
| Nenhuma TEST credential em Production | **FALHA potencial** — token prod ausente; não provar ausência de TEST em shared pulls |
| Nenhum E2E bypass em Production | **OK** (ausente no `env ls`) |
| Nenhum mock/simulation | **OK** (`ALLOW_SIMULATED` só Preview) |
| Nenhuma URL homolog em Production | **NÃO PROVADO** (URLs shared/sensitive) |
| Banco Production exclusivo | **NÃO PROVADO** sem fingerprint compare |
| Secrets próprios por ambiente | **PARCIAL** — vários shared Preview+Production |

---

## Gaps inventário

1. Confirmar project Supabase Production + PITR no dashboard.  
2. Pull Production não-redigido (ou fingerprints runtime) para matriz de hosts.  
3. Configurar credenciais MP Production **somente após autorização**.  
4. Separar `APP_URL` / `NEXTAUTH_URL` / auth secrets Preview vs Production.
