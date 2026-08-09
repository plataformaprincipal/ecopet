# FASE 3.5 — Backup / Restore Drill (Homolog)

**Data:** 2026-08-09  
**Ambiente alvo:** Supabase / Postgres `eccopet-homolog`  
**Production:** não tocada

## Estratégia atual (documentada)

| Item | Estado |
| ---- | ------ |
| Provedor | Supabase (sa-east-1 pooler) |
| Backup automático | Gerenciado pelo plano Supabase do projeto |
| PITR | Depende do plano (não confirmado API nesta sessão) |
| Retenção | Conforme dashboard Supabase (não exportada aqui) |
| RPO | **Não medido** nesta execução |
| RTO | **Não medido** nesta execução |

## Drill executado

**Tipo:** não destrutivo / documentação + validação de conectividade homolog  
**Restore para ambiente isolado adicional:** **NÃO executado** (sem projeto restore dedicado provisionado; risco de sobrescrever `eccopet-homolog` rejeitado).

### Validação em homolog vivo (não restore)

Tabelas críticas acessíveis via Prisma (hardening script / Fase 3):

- User, Order, Payment, FinancialLedgerEntry, FinancialReserve, PartnerPayout, PaymentRefund, AuditLog, MpWebhookEvent

## Classificação

```text
P1 ABERTO — BACKUP/RESTORE DRILL NÃO COMPROVADO
```

Antes de piloto real: provisionar projeto/branch Supabase de restore isolado, restaurar snapshot, comparar contagens sanitizadas das tabelas críticas, documentar RPO/RTO.
