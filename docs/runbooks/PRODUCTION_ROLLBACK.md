# Runbook — Production Rollback

**Nunca executar sem autorização explícita.**

---

## 1. Vercel deployment

```text
# Listar deployments (apps/web → ecopet-web)
npx vercel@58.7.1 ls --cwd apps/web

# Alias domínio Production para deployment anterior conhecido-bom
npx vercel@58.7.1 alias set https://<dpl-bom>.vercel.app www.eccopet.com --scope ecopet-s-projects --cwd apps/web
# + eccopet.com se aplicável
```

Validar: `/api/health`, login, checkout config (sem cobrar).

---

## 2. Feature flags

| Problema | Ação rápida |
| -------- | ----------- |
| Pagamentos | `PAYMENT_PROVIDER=none` ou freeze operacional |
| Payouts | `PAYOUTS_ENABLED=false` |
| Ledger | `FINANCIAL_LEDGER_ENABLED=false` (só se piorar; preferir freeze) |
| Manutenção | admin `maintenanceMode` |

Redeploy pode ser necessário para env; preferir flags já injetadas.

---

## 3. Payment / provider

1. Desabilitar novos checkouts.  
2. Não reprocessar webhooks em massa sem plano.  
3. Conciliar MP panel × DB.  
4. Só reabrir com auth.

---

## 4. Payout

1. `PAYOUTS_ENABLED=false`  
2. Cancelar/hold aprovações pendentes  
3. Auditar `PartnerPayout`

---

## 5. Migration

- Preferir **forward-fix**.  
- Rollback schema via restore (ver `PRODUCTION_DATABASE_RECOVERY.md`).  
- Nunca `migrate reset` em Production.

---

## 6. Domain

Reapontar DNS/alias Vercel para deployment estável; validar TLS e cookies.

---

## 7. Checklist pós-rollback

- [ ] Health OK  
- [ ] Sem pagamento novo indevido  
- [ ] Payouts frozen  
- [ ] Incidente aberto  
- [ ] Comunicação stakeholders  
