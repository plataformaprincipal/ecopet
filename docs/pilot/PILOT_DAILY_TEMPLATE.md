# Pilot Daily Report — Template

**Date:** YYYY-MM-DD  
**Operator:**  
**Environment:** Production piloto / limites ativos  

| Campo | Valor |
| ----- | ----- |
| Users (ativos / novos) | |
| Partners (ativos) | |
| Orders | |
| GMV (cents) | |
| Revenue EccoPet (cents) | |
| Payments OK | |
| Payments fail | |
| Webhook OK / fail / sig fail | |
| Refunds | |
| Chargebacks | |
| Ledger posts | |
| Reserve | |
| Payables | |
| Payouts (deve ser 0 se manual off) | |
| Reconciliation status | |
| Support tickets | |
| Incidents (P0/P1) | |
| Decision | CONTINUE / THROTTLE / STOP |

### Por pedido (anexo)

Order ID · Payment ID · Provider status · Order status · Ledger · Reserve · Partner payable · Refund · Payout · Recon

### Fechamento

```text
Opening balance
+ payments
- refunds
- payouts
± adjustments
= closing balance
⇔ ledger
```

### Stop conditions hit?

- [ ] double charge  
- [ ] ledger duplicado  
- [ ] PAID indevido  
- [ ] payout incorreto  
- [ ] mismatch sem explicação  
- [ ] fraude / vazamento / auth bypass / DB down  
