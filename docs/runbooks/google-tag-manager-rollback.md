# Runbook — GTM Rollback

## Config operacional

PATCH `/api/admin/gtm/config` com `{ "collectionEnabled": false }` pausa flags ops (não remove o script se o frontend ainda carregar por env — alinhar `loadContainer` / feature flags client).

## Env

1. Remover ou esvaziar `NEXT_PUBLIC_GTM_ID` na Vercel
2. Redeploy
3. Confirmar painel: not_configured

## Deduplicação

Tabela `AnalyticsTransactionalDedup` é independente. Rollback de migration:

```sql
DROP TABLE IF EXISTS "AnalyticsTransactionalDedup";
```

Só em emergência e com backup. Preferir manter a tabela.

## Código

Reverter PR da camada `lib/server/gtm` + rotas `/api/admin/gtm/{status,health,...}` + claim.

## Checkout

Se claim falhar, o checkout ainda pode enviar purchase (best-effort) + dedupe client — comportamento degradado, não bloqueio de pagamento.
