# FASE 6 — Baseline

**DATA DE INÍCIO:** 2026-08-09  
**VERSÃO / COMMIT:** `5afc0720d71fd92505b837e40260f651dbe61028`  
**BRANCH:** `test/fase-3-1-financial-preview`  
**REMOTE:** `origin` → `plataformaprincipal/ecopet`  
**WORKING TREE:** sujo (patches assinatura/recon/docs Fases 3–5 + validator Production)  
**AMBIENTE BASE:** Preview `homolog.eccopet.com` / DB homolog Supabase / MP **test**  
**PRODUCTION:** domínio `www.eccopet.com` existe; **sem** go-live financeiro autorizado nesta linha  
**PROVIDER PAGAMENTO:** Mercado Pago (sandbox comprovado; Production credentials incompletas)  
**MIGRATIONS GIT:** 29 (última `20260806180000_fase3_financial_ledger`)  
**FLAGS (política):** payouts manuais / Production flags unset→off; Preview financeiras ligadas  

---

## Estado do piloto real

| Campo | Valor |
| ----- | ----- |
| Piloto real executado? | **NÃO** |
| Veredito Fase 5 | `PILOTO REAL REPROVADO` |
| Dry-run operacional 3.7 | **NÃO executado** |
| USUÁRIOS (piloto real) | **0** |
| PARCEIROS (piloto real) | **0** |
| PEDIDOS (piloto real) | **0** |
| GMV | **0** |
| RECEITA | **0** |
| REFUNDS | **0** |
| PAYOUTS | **0** |
| TICKETS | **0** |
| INCIDENTES (piloto real) | **0** (bloqueado antes da abertura) |

### Limites previstos (não ativados)

≤20 users · ≤3 partners · ≤10 orders/day · ≤R$500 GMV/day · ≤R$100/order · `PAYOUTS_ENABLED=false`

---

## Evidência pré-piloto (homolog/sandbox) — não confundir com piloto real

| Item | Evidência |
| ---- | --------- |
| Cobrança sandbox Orders | accredited (ex. `ORDTST01…YHGD`) |
| Webhook natural | chega ~2s; **`SIGNATURE_MISMATCH`** |
| Payment/Order PAID via webhook natural | **não** |
| Ledger pós-webhook natural | **0** |
| Fase 2 E2E homolog | 24/24 (ciclo anterior) |
| Fase 3 E2E homolog | 16/16 (ciclo anterior) |
| `test:finance` / `test:mercado-pago` | 42 / 21 (patches locais) |
| Hardening DB concorrente | OK (ciclo anterior) |

---

## PENDÊNCIAS / RISCOS NA ENTRADA

| ID | Sev | Descrição |
| -- | --- | --------- |
| INC-SIG-001 | **P0** | Webhook natural HMAC mismatch (secret painel ≠ Preview) |
| R-PROD-MP | **P0** | Production sem Access Token / Public Key / ENVIRONMENT |
| R-3.5-BACKUP | P1 | Restore drill isolado não executado |
| R-3.7-DRY | P1 | Dry-run operacional não executado |
| R-BYPASS | P1 | Bypass Vercel na URL webhook homolog |
| R-WT | P2 | Patches críticos não commitados |
| R-FLOAT | P2 | Float residual Order vs cents |

---

## Princípio aplicado nesta fase

Sem piloto real concluído, a Fase 6 **não inventa** unit economics, retenção ou tickets.  
Consolida falhas **pré-piloto** e bloqueia Fase 7 até haver operação real reconciliável **ou** até os P0 de abertura serem fechados com evidência.
