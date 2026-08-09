# FASE 6.2 — Backup / Restore Drill

**Escopo:** homologação  
**Production:** não tocada

## Resultado

```text
P1 ABERTO — RESTORE ISOLADO NÃO EXECUTADO
```

| Item | Status |
| ---- | ------ |
| Backup gerenciado Supabase homolog | plano dashboard (não API) |
| Projeto/branch restore isolado | **não provisionado** |
| Restore executado | **não** |
| Validação Order/Payment/Ledger/Reserve/Refund/Payout/AuditLog | N/A |
| RPO / RTO | **não medidos** |

**Justificativa:** executar restore sem projeto isolado arrisca sobrescrever `eccopet-homolog`. Requer autorização + provisionamento humano.

Pré-requisito para fechar: criar projeto Supabase `eccopet-restore-drill`, restore snapshot, comparar contagens sanitizadas, documentar RPO/RTO.
