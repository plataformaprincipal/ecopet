# Runbook — Production Database Recovery

**Escopo:** Postgres / Supabase Production EccoPet  
**Não executar restore no banco Production sem autorização explícita.**

---

## 1. Estratégia

| Item | Estado / ação |
| ---- | ------------- |
| Backup gerenciado | Dashboard Supabase → Backups (confirmar plano) |
| PITR | Se contratado: Point-in-Time Recovery no dashboard |
| Retenção | Conforme plano (documentar dias no inventário) |
| RPO alvo piloto | ≤ 24h (mínimo); ideal ≤ 1h com PITR |
| RTO alvo piloto | ≤ 4h para restore isolado + cutover controlado |
| Drill | **P1 aberto** — ver `docs/FASE_3_5_BACKUP_RESTORE_DRILL.md` |

---

## 2. Antes de qualquer migrate Production

1. Confirmar snapshot recente ou PITR window.  
2. Anotar `migrate status` (RO).  
3. Comunicar janela.  
4. Ter owner on-call.

---

## 3. Restore procedure (isolado — preferido)

1. Criar projeto/branch Supabase **novo** (nunca sobrescrever Production).  
2. Restore snapshot → projeto isolado.  
3. Validar contagens sanitizadas: User, Order, Payment, FinancialLedgerEntry, FinancialReserve, PartnerPayout, PaymentRefund, AuditLog, MpWebhookEvent.  
4. Comparar checksums/contagens vs Production RO.  
5. Só então planejar cutover (autorização separada).

---

## 4. Restore de emergência Production (último recurso)

**Requer autorização explícita.**

1. Congelar writes (kill switches: pagamentos/payouts).  
2. Snapshot “agora” se possível.  
3. Restore ponto escolhido.  
4. `prisma migrate status` + smoke health.  
5. Reconciliar financeiro.  
6. Reabrir sob autorização.

---

## 5. Contatos

| Papel | Owner (preencher) |
| ----- | ----------------- |
| DB / SRE | TBD |
| Financeiro | TBD |
| Incident commander | TBD |
