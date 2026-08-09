# Production Kill Switch Matrix

**Data:** 2026-08-09  
**Ambiente alvo:** Vercel Production `ecopet-web`

| FLAG | EFEITO | OWNER | QUANDO USAR | RECOVERY |
| ---- | ------ | ----- | ----------- | -------- |
| `CHECKOUT_ENABLED=false` | Bloqueia novos checkouts e cobranças MP; preserva pedidos/ledger/refunds | Eng/Ops | P0 checkout / incidente pagamento | `CHECKOUT_ENABLED=true` + smoke |
| `PAYMENT_PROVIDER=none` | Desliga provider de pagamento | Eng/Fin | P0 pagamento / fraude | Restaurar `mercado_pago` + smoke |
| `ALLOW_SIMULATED_PAYMENTS` | **Deve permanecer false/ausente** | Eng | Nunca em Production | Remover var |
| `FINANCIAL_LEDGER_ENABLED=false` | Para postagens ledger | Fin | Ledger corrupto | Corrigir + `true` |
| `PAYOUTS_ENABLED=false` | Bloqueia payouts | Fin | Default piloto; qualquer P0 $ | Manter false até OK |
| `MANUAL_PAYOUT_APPROVAL_REQUIRED=true` | Exige aprovação admin | Fin | Sempre no piloto | Não desligar cedo |
| `RESERVE_ENABLED=false` | Desliga reserve | Fin | Bug reserve | Corrigir + religar |
| `CHARGEBACKS_ENABLED=false` | Desliga fluxo chargeback app | Fin | Bug chargeback | Corrigir + religar |
| `DAILY_RECONCILIATION_ENABLED=false` | Para job recon diário | Fin | Job quebrado | Fix + religar |
| `AI_ENABLED=false` / `OPENAI_PAUSED=1` | Desliga IA | Eng | Custo/abuso | Religar controlado |
| `NEXT_PUBLIC_GTM_ENABLED=false` | Para GTM client | Growth | Tag errada | Corrigir ID + religar |
| `TURNSTILE_ENABLED=false` | Afeta forms (evitar) | Sec | Só se outage CF | Religar imediato |
| Admin `maintenanceMode` | Manutenção app | Ops | Incidente amplo | Desligar após health |
| Deploy rollback Vercel | Volta deployment anterior | DevOps | Release ruim | Alias Production → dpl bom |

### Lacunas

- Sem kill switch global de **checkout** dedicado (usar `PAYMENT_PROVIDER` / manutenção).  
- Sem kill switch marketplace dedicado (manutenção / unpublish produtos).
