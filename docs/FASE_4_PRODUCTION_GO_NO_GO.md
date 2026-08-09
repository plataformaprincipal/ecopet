# FASE 4.21 — Production Go / No-Go Checklist

**Data:** 2026-08-09  
**Deploy Production nesta fase:** **NÃO AUTORIZADO**

| Item | Status |
| ---- | ------ |
| Production env validada (`check-production-environment.mjs`) | [ ] **NO-GO** — MP token/key/env ausentes; URLs/secrets shared a auditar |
| Production DB validado (migrate status RO) | [ ] **NO-GO** — não conectado |
| migrations revisadas | [~] schema Git OK; pendência status DB |
| backup | [ ] drill/PITR não comprovados |
| rollback | [x] runbook escrito |
| MP Production validado | [ ] **NO-GO** — credenciais ausentes no env |
| webhook Production configurado | [ ] URL/secret app Production não comprovados |
| simulated payments off | [x] ausente em Production env ls |
| E2E flags off | [x] Preview-only |
| Turnstile real | [ ] shared keys — validar não-test |
| alerts | [~] matriz pronta; wiring incompleto |
| logs (sem secrets) | [~] código fail-closed; auditoria runtime incompleta |
| security (E2E/mock/diagnostics) | [~] env OK parcial; R-3.3-SIG aberto em Preview |
| domain/TLS | [x] www 200 / apex 308 |
| policies (termos/privacidade) | [~] rotas existem; jurídico pendente |
| support | [~] canais a formalizar |
| financial limits | [x] proposta documentada |
| kill switches | [x] matriz |
| payout policy | [x] conservadora (`PAYOUTS_ENABLED=false`) |
| owners definidos | [ ] TBD |
| **Pré-piloto Fase 3.3 webhook assinado** | [ ] **NO-GO** (P0) |
| Patches commitados / regressão verde | [ ] working tree sujo |

### Decisão

```text
NO-GO — PRODUCTION DEPLOY / PAGAMENTO REAL NÃO AUTORIZADOS
```
