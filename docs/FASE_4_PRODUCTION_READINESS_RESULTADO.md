# FASE 4 — Production Readiness — Resultado

**Branch:** `test/fase-3-1-financial-preview` @ `5afc072`  
**Data:** 2026-08-09  
**Deploy Production:** **não realizado**  
**Migrate Production:** **não realizado**  
**Pagamento/payout real:** **não realizado**

---

## Veredito

```text
FASE 4 BLOQUEADA — RISCO CRÍTICO
```

Mesmo trechos preparados (inventário, validator, runbooks, limites, kill switches) **não** autorizam deploy.

---

## O que foi entregue

| Artefato | Path |
| -------- | ---- |
| Master 4/5 | `docs/FASE_4_5_MASTER_EXECUTION.md` |
| Inventário + matriz | `docs/FASE_4_PRODUCTION_INVENTORY.md` |
| Env validator | `scripts/check-production-environment.mjs` |
| DB audit RO | `docs/FASE_4_PRODUCTION_DATABASE_AUDIT.md` |
| Recovery | `docs/runbooks/PRODUCTION_DATABASE_RECOVERY.md` |
| Kill switches | `docs/PRODUCTION_KILL_SWITCH_MATRIX.md` |
| Alerts | `docs/PRODUCTION_ALERT_MATRIX.md` |
| Rollback | `docs/runbooks/PRODUCTION_ROLLBACK.md` |
| Go/No-Go | `docs/FASE_4_PRODUCTION_GO_NO_GO.md` |

---

## Bloqueadores críticos

1. **R-3.3-SIG** — webhook natural Preview ainda `SIGNATURE_MISMATCH`.  
2. **R-PROD-MP** — Production sem `MERCADO_PAGO_ACCESS_TOKEN` / public key / `MERCADO_PAGO_ENVIRONMENT`.  
3. **DB Production** — migrate status / drift não auditados.  
4. **Backup restore** — drill isolado aberto.  
5. **URL/secret sharing** Preview+Production — risco de homolog em prod.  
6. Working tree com patches financeiros não commitados.

---

## Payment readiness (4.7)

```text
PRODUCTION_PAYMENT_BLOCKED
```

Motivo: credenciais Production incompletas + webhook/assinatura não comprovados no domínio canônico + P0 Preview ainda aberto.

---

## Política payout / limites (4.8–4.9) — proposta

| Config | Valor proposto piloto |
| ------ | --------------------- |
| PAYOUTS_ENABLED | **false** |
| MANUAL_PAYOUT_APPROVAL_REQUIRED | **true** |
| RESERVE_ENABLED | **true** |
| MAX_ORDER_VALUE | 10000 cents (R$100) |
| MAX_GMV_DAY | 50000 cents (R$500) |
| MAX_ORDERS_DAY | 10 |
| MAX_REFUND_DAY | = GMV day |
| MAX_PAYOUT_DAY | 0 enquanto PAYOUTS false; depois ≤ AVAILABLE |
| MAX_PARTNER_BALANCE | 200000 cents |
| MAX_NEGATIVE_BALANCE | 0 (alerta se &lt; 0) |
| Prazo mínimo repasse | T+7 dias úteis após PAID sem refund/chargeback |
| Reserve | retenção conservadora (ex. 10–20%) até janela |

---

## Deploy dry-run (4.20) — simulado (não Production)

1. Tag/version: `git rev-parse HEAD` + changelog  
2. Build: `npm run build` (local/CI)  
3. Migration validation: `prisma migrate status` **RO** em Production (auth)  
4. Deploy: `vercel deploy --prod` — **NÃO EXECUTAR**  
5. Health: `https://www.eccopet.com/api/health`  
6. Smoke: login + catalog + checkout config (sem charge)  
7. Finance check: flags + ledger disabled/enabled conforme política  
8. Rollback: alias deployment anterior (`PRODUCTION_ROLLBACK.md`)

---

## Security / logging (resumo)

- Proibido logar tokens, secrets, cookies, PAN/CVV, bypass, webhook secret (código atual de webhook usa fingerprints).  
- E2E/simulado: ausentes Production env ls.  
- Diagnostics sensíveis: manter admin-auth; não expor em público.

---

## Próximo passo (requer autorização humana)

Quando quiser avançar **somente** configuração env Production (ainda sem deploy novo / sem cobrar):

```text
AÇÃO SOLICITADA: cadastrar MERCADO_PAGO_* Production + separar APP_URL/NEXTAUTH/auth secrets
RISCO: credencial errada / TEST em prod / URL homolog
ROLLBACK: remover vars / restaurar valores anteriores
PRÉ-REQUISITOS: app MP Production; secret webhook revelado; domínio canônico
EVIDÊNCIA: env ls + check-production-environment READY
IMPACTO MÁXIMO: app Production passa a poder cobrar se token válido + checkout aberto
RECOMENDAÇÃO: manter PAYOUTS_ENABLED=false; PAYMENT_PROVIDER=none até go humano
```
