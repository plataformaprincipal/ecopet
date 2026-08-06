# Rollback — Fase 2.2 Preview / Homologação

## Escopo

Procedimentos não destrutivos para Preview Vercel, Mercado Pago sandbox e banco de homologação.  
**Não** usar `prisma migrate reset` nem rollback SQL destrutivo de migration já aplicada.

## Cenários

### 1. Deploy Preview defeituoso

1. Na Vercel: promover o deployment Preview anterior estável **ou** fazer novo deploy do commit/branch conhecido.
2. Não promover o Preview falho para Production.
3. Invalidar cache do deployment se necessário.
4. Manter URL antiga acessível até smoke test do novo Preview.

### 2. Migration incompatível

1. Não executar `migrate reset`.
2. Desativar checkout no Preview (`PAYMENT_PROVIDER=none` ou flag de manutenção se existir).
3. Corrigir com **nova** migration forward-only.
4. Pedidos já criados permanecem; reconciliar via `Payment` / `PaymentEvent` / admin MP.

### 3. Webhook com erro

1. Remover ou pausar a URL Preview no painel Mercado Pago (sandbox).
2. Impedir novas cobranças (`PAYMENT_PROVIDER=none` em Preview).
3. Preservar eventos `MpWebhookEvent` / `PaymentEvent` para reconciliação.
4. Corrigir assinatura/secret; reprocessar eventos apenas via fluxo admin autorizado.

### 4. Credencial incorreta

1. Rotacionar token/secret no painel MP sandbox.
2. Atualizar variáveis **somente Preview** na Vercel.
3. Redeploy Preview.
4. Não copiar secrets de Production para Preview sem isolamento.

### 5. Mercado Pago indisponível

1. Desativar checkout online temporariamente.
2. Manter consulta de pedidos existentes.
3. Não forçar `PAID` via API interna em Production/Preview comercial.
4. Retomar quando sandbox/API estiver saudável.

## Princípios

| Ação | Permitido |
| ---- | --------- |
| Reverter deployment Preview | Sim |
| Desativar novas cobranças | Sim |
| Preservar pedidos/eventos | Sim |
| `migrate reset` | **Não** |
| Apagar dados de clientes reais | **Não** |
| Deploy Production nesta fase | **Não** |
