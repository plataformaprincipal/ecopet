# FASE 6.2 — Webhook P0

## Pré-checks (automatizáveis)

| Check | Evidência |
| ----- | --------- |
| Runtime secretSha8 último natural | **`bfcd6920`** (04:56Z, `ORDTST01…FA7Z`) |
| Local `.env.preview.verify` webhook sha8 | **`bfcd6920`** (igual) |
| Secret Preview alterado após 6.1 com valor **novo** do painel? | **NÃO comprovado** — fingerprint estável |
| Alteração de manifest/HMAC nesta fase | **nenhuma** |
| Alertas P0 signature | AuditLog `P0:WEBHOOK_SIGNATURE_FAILURE` emitido |

## Prova natural nesta fase

**Não reexecutada** — sem mudança de secret, resultado seria idêntico (desperdício + ruído).  
Última prova válida (6.1): natural ~4s, `signatureValid=false`, `SIGNATURE_MISMATCH`, Payment `PROCESSING`, ledger 0.

## Classificação

```text
PROVIDER/APP SECRET MISMATCH
```

O validador (SDK-aligned, candidates=5, queryDataId=1) não reproduz o `v1` do Mercado Pago com o secret Preview atual (`secretSha8=bfcd6920`).

## Ação humana obrigatória (única via)

1. Painel MP → **mesma** app das credenciais TEST (`APP_USR-02…`).  
2. Webhooks → **revelar** Assinatura secreta **atual**.  
3. Atualizar Vercel Preview `MERCADO_PAGO_WEBHOOK_SECRET`.  
4. Redeploy Preview.  
5. Confirmar no próximo reject/success que `secretSha8` **mudou**.  
6. Nova Order sandbox + webhook natural → `signatureValid=true` + PAID + ledger.

Não usar `vercel env pull` Sensitive como prova do valor.
