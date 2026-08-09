# Fases 4 e 5 — Master Execution

**Data início:** 2026-08-09  
**Executor:** agent (somente preparação; sem Production deploy / pagamento real / commit)

---

## 1. Estado de entrada (registrado)

| Item | Valor |
| ---- | ----- |
| Branch | `test/fase-3-1-financial-preview` |
| HEAD | `5afc0720d71fd92505b837e40260f651dbe61028` |
| Remote | `origin` → `https://github.com/plataformaprincipal/ecopet.git` |
| Upstream | `origin/test/fase-3-1-financial-preview` (0 ahead / 0 behind) |
| Working tree | **sujo** — patches assinatura MP, recon provider-aware, docs 3.3–3.7, scripts `_tmp-*` |
| Commits não enviados | nenhum (sync com upstream); **alterações locais não commitadas** |
| Migrations no Git | **29** (última `20260806180000_fase3_financial_ledger`) |
| Preview | `homolog.eccopet.com` → projeto Vercel `ecopet-web` (Node 24.x, region `gru1`) |
| Production atual | URL Latest Production: `https://www.eccopet.com` (HTTP 200); `https://eccopet.com` → **308** |
| Domínio | `eccopet.com` / `www` / `homolog` |
| Banco Preview | Supabase homolog (`eccopet-homolog` / pooler sa-east-1) |
| Banco Production | `DATABASE_URL` + `DIRECT_URL` existem no env Production (valores não inspecionados; **sem migrate/status aplicado nesta sessão**) |
| Mercado Pago Preview | TEST / `APP_USR-02…` — webhook natural **SIGNATURE_MISMATCH** (P0 aberto) |
| Mercado Pago Production | `MERCADO_PAGO_WEBHOOK_SECRET` presente; **ACCESS_TOKEN / PUBLIC_KEY / ENVIRONMENT ausentes no env Production** (CLI `env ls`) |
| Vercel | team `ecopet-s-projects`; projetos `ecopet-web` (app) e `ecopet_github` (root link) |
| Supabase | homolog em uso; Production project mapping **a confirmar no dashboard** |
| Flags financeiras Preview | presentes (ledger/payout/reserve/…) |
| Flags financeiras Production | **ausentes** → `prodSafe` default **off** em Vercel Production |
| Secrets | Sensitive na Vercel; working tree não deve versionar `.env*` |
| Observabilidade | Better Stack vars em Preview+Production; health `/api/health` |
| Documentação prévia | Fases 1–3.7, `FINANCIAL_*`, runbooks, checklists `docs/production/*` |

---

## 2. Riscos conhecidos das fases anteriores (não apagar)

| ID | Origem | Sev | Descrição | Status entrada |
| -- | ------ | --- | --------- | -------------- |
| R-3.3-SIG | Fase 3.3 | **CRITICAL** | Webhook natural MP Preview: `SIGNATURE_MISMATCH` (secrets `9d2804a9` e `bfcd6920` falharam) | **ABERTO** |
| R-3.3-BYPASS | Fase 3.3/3.6 | HIGH | URL webhook homolog com Vercel Automation Bypass | ABERTO (operacional) |
| R-3.4-EXT | Fase 3.4 | HIGH | Hardening interno OK; confirmação externa via webhook natural falha | ABERTO (depende R-3.3) |
| R-3.5-RECON | Fase 3.5 | MEDIUM | Recon provider-aware em código local; não commitado / não em Production | PARCIAL |
| R-3.5-BACKUP | Fase 3.5 | HIGH | Backup/restore drill isolado **não** executado | **ABERTO** |
| R-3.5-ALERT | Fase 3.5 | MEDIUM | Política de alertas documentada; integração ferramenta incompleta | PARCIAL |
| R-3.6-LGPD | Fase 3.6 | MEDIUM | Matriz LGPD sem E2E destrutivo completo | PARCIAL |
| R-3.6-FLOAT | Fase 3.6/money | MEDIUM | Float residual em Order vs cents no ledger | DOCUMENTADO |
| R-3.7-DRY | Fase 3.7 | HIGH | Dry-run operacional **não** executado (gate 3.3) | **ABERTO** |
| R-WT-DIRTY | Git | MEDIUM | Patches críticos só no working tree | ABERTO |
| R-PROD-MP | Fase 4 inventário | **CRITICAL** | Production sem Access Token / Public Key / ENVIRONMENT MP | **ABERTO** |
| R-PROD-URL-SHARE | Fase 4 inventário | HIGH | `APP_URL` / `NEXTAUTH_URL` / `WEB_URL` / secrets auth marcados Preview+Production (possível compartilhamento) | **AUDITAR** |
| R-PILOT-CLOSED | Fase 3.7 | CRITICAL | Veredito pré-piloto: **PILOTO BLOQUEADO** | VIGENTE |

---

## 3. Regras absolutas desta execução

- Sem merge `main`, deploy Production, migrate Production, `db push`, reset, DROP/TRUNCATE  
- Sem pagamento/payout real  
- Sem commit/push automático  
- Qualquer ação Production → **PARE** e peça autorização explícita  

---

## 4. Plano de execução

| Bloco | Entrega | Status |
| ----- | ------- | ------ |
| 4.1 Inventário | `docs/FASE_4_PRODUCTION_INVENTORY.md` | **feito** |
| 4.2 Matriz Preview×Prod | na inventory | **feito** |
| 4.3 Validator | `scripts/check-production-environment.mjs` | **feito** (veredito BLOCKED) |
| 4.4–4.6 DB/backup | audits + runbook recovery | **parcial** (RO; sem migrate; drill aberto) |
| 4.7–4.10 Payments/payout/limits/flags | docs readiness | **feito** (payment BLOCKED) |
| 4.11–4.19 Obs/alerts/security/rollback | docs | **feito** (wiring alertas parcial) |
| 4.20–4.22 Dry-run simulado + Go/No-Go + veredito | docs | **feito** → FASE 4 BLOQUEADA |
| 5.x Piloto real | plano + template + resultado | **planejado / REPROVADO execução** |

---

## 5. Ponto de parada autorizado

Ao primeiro pedido de:

- deploy Production  
- migrate Production  
- credencial MP Production nova  
- pagamento real  
- payout real  

→ apresentar formulário: AÇÃO / RISCO / ROLLBACK / PRÉ-REQUISITOS / EVIDÊNCIA / IMPACTO / RECOMENDAÇÃO e **aguardar**.
