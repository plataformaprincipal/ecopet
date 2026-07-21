# Parecer Final — Etapa 5 (Auditoria Final de Produção)

**Data:** 2026-07-20 (America/Sao_Paulo)  
**Branch:** `release/etapa-5-auditoria-final`  
**Commit base (pré-correções):** `a87e0bab59c4b24771d80877a7bd0ce9d7bda1b8`  
**Commit release (Etapa 5):** `73238c6`  
**Node:** v24.16.0 · **npm:** 11.13.0 · **OS:** Windows 10.0.26200

---

## Parecer

# APROVADO PARA PRODUÇÃO COM RESSALVAS

**Não** emitir `PRODUÇÃO IMPLANTADA E VALIDADA` — CLI Vercel/GitHub ausentes neste ambiente; deploy Preview/Production **não executado**.

**Não** emitir `APROVADO PARA PRODUÇÃO` pleno — integrações Live incompletas no env local, Better Stack ausente, `PAYMENT_PROVIDER=none`, TalkJS APP_ID ausente, residual `npm audit` High (nodemailer cadeia / firebase-admin transitivos), rate-limit HTTP da suíte `test:security` não fechou (timeout de pool no fim da suíte).

---

## O que foi comprovado nesta etapa

| Item | Status |
|------|--------|
| lint | APROVADO |
| type-check | APROVADO |
| build produção | APROVADO |
| db:generate | APROVADO |
| permissions unit 43/43 | APROVADO |
| Mercado Pago unit 20/20 | APROVADO |
| no-mocks 3/3 | APROVADO |
| observability 11/11 | APROVADO |
| Servidor estável `:3002` + `/api/health/live` | APROVADO (após correção P0) |
| Headers CSP/HSTS/XFO/nosniff/Referrer/Permissions | APROVADO (local `next start`) |
| IDOR pets/orders/messages/posts/comments/LGPD export | APROVADO (`test:security`) |
| RBAC CLIENT vs ADMIN | APROVADO (`test:security`) |
| Rate limit login HTTP | NÃO EXECUTADO (timeout; suíte travava no fim) |
| Deploy Preview/Production | NÃO EXECUTADO |
| Pagamento Live / webhook prod | BLOQUEADO POR CREDENCIAL / provider=none |
| Better Stack evento real | BLOQUEADO POR CREDENCIAL |
| TalkJS Live | BLOQUEADO POR CREDENCIAL (APP_ID MISSING) |

---

## Correções aplicadas (Etapa 5)

1. **P0** — `next start` + flags de teste derrubavam o boot via `validateProductionEnv` → harness `ECOPET_STABLE_TEST_SERVER` (nunca na Vercel).  
2. **P0/P1** — `start-stable-test-server` aguarda `/api/health/live`; RELAXED default off.  
3. **Deps** — overrides `ws@8.21.1`, `form-data@4.0.6`; `next-auth@4.24.15`. Audit prod: High 5 → **2**.  
4. **Vercel** — `apps/web/vercel.json` (install/build monorepo, região `gru1`).  
5. **test:security** — body `identifier`, timeout em rate-limit, cap de tentativas.

---

## Passo manual restante (deploy)

1. Instalar/autenticar Vercel CLI: `npm i -g vercel` → `vercel login`  
2. Importar `.env.vercel.preview.example` / `.env.vercel.production.example` (placeholders → secrets reais)  
3. `vercel link` (Root Directory `apps/web`)  
4. Deploy Preview → smoke (`docs/release/post-deploy-smoke.md`)  
5. Gate → Production apenas sem P0/P1  
6. Confirmar webhooks MP/TalkJS na URL pública  

Comandos: ver `docs/release/vercel-deployment.md`.
