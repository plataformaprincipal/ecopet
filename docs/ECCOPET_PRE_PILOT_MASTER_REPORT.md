# EccoPet — Pre-Pilot Master Report (Fases 3.3–3.7)

**Data:** 2026-08-09  
**Branch:** `test/fase-3-1-financial-preview` @ `5afc072`  
**Ambiente:** Preview / homolog.eccopet.com / eccopet-homolog / MP test  
**Production:** intocada  
**Working tree:** sujo (patches assinatura, recon provider-aware, docs 3.4–3.7)

---

## Resumo por fase

| Fase | Status |
| ---- | ------ |
| 3.3 | **BLOQUEADA** — webhook natural chega; `SIGNATURE_MISMATCH` (P0 externo/secret) |
| 3.4 | **PARCIAL** — hardening interno OK; FIN-001 externo aberto |
| 3.5 | **PARCIAL** — recon provider-aware + alertas docs; backup drill P1 aberto |
| 3.6 | **PARCIAL** — Critical = assinatura webhook |
| 3.7 | **NÃO EXECUTADA** — gate 3.3 falhou; dry-run não iniciado |

---

## P0 / P1

### P0 FECHADOS
- (nenhum bloqueador P0 de piloto fechado)

### P0 ABERTOS
1. **Webhook natural Mercado Pago: `SIGNATURE_MISMATCH`** — entrega OK; HMAC diverge com `secretSha8` `9d2804a9` e `bfcd6920` (ambos testados). Classificação: **integração/secret do painel**.

### P1 FECHADOS (código/docs nesta árvore)
- Reconciliação provider-aware (amount efetivo; `VALUE_MISMATCH` / `MANUAL_REVIEW`) + testes  
- Política de alertas (`docs/FINANCIAL_ALERTING_POLICY.md`)  
- Auditoria precisão monetária (`docs/FINANCIAL_MONEY_PRECISION_AUDIT.md`)  
- Matriz LGPD retenção/exclusão (`docs/LGPD_DATA_RETENTION_DELETION_MATRIX.md`)  
- Diagnostics sanitizados de assinatura + vetores unitários

### P1 ABERTOS
- Backup/restore drill isolado (`docs/FASE_3_5_BACKUP_RESTORE_DRILL.md` — risco aberto)  
- Dry-run operacional 3.7  
- Bypass Vercel na URL de webhook de homolog (risco operacional residual)  
- Float em partes do domínio Order (documentado; sem migração ampla)

---

## Evidência natural (último)

- Deploy: `ecopet-mm3co6q98…` → `homolog.eccopet.com`  
- Charge sandbox `ORDTST01…YHGD` accredited  
- Natural ~2s: `signatureValid=false`, `candidates=5`, `queryDataId=1`  
- Payment permanece `PROCESSING`; ledger 0

---

## Veredito final

```text
PILOTO BLOQUEADO
```

Não pronto para Production. Dry-run 3.7 **não** executado por regra de gate.

### Checklist PILOTO FECHADO AUTORIZADO

- [ ] webhook natural assinado  
- [ ] Payment/Order PAID via webhook  
- [ ] ledger correto  
- [x] reconciliation provider-aware (código + unit)  
- [~] hardening financeiro (interno OK; externo aberto)  
- [ ] nenhuma Critical segurança  
- [x] alertas mínimos definidos (política)  
- [ ] backup/restore suficientemente tratado  
- [ ] dry-run operacional aprovado  
- [~] regressão unitária MP/finance verde; suite completa pré-commit pendente  
