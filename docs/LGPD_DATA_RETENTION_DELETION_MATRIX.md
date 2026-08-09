# LGPD — Matriz retenção / exclusão (técnica)

**Escopo:** política técnica Preview/piloto. Sem exclusão destrutiva em massa nesta fase.

## Pode anonimizar / apagar (após processo)

| Dado | Ação sugerida |
| ---- | ------------- |
| Preferências UI | apagar |
| Conteúdo social não litigioso | anonimizar autor |
| Username/display (não financeiro) | anonimizar |
| Telefone/email marketing | apagar se sem obrigação |

## Exige retenção (financeiro / legal / antifraude)

| Dado | Motivo | Prazo mínimo sugerido |
| ---- | ------ | --------------------- |
| Order / Payment / Ledger | prova comercial + recon | 5 anos (política a validar juridicamente) |
| Refund / Chargeback / Payout | disputa | 5 anos |
| AuditLog financeiro | accountability | 5 anos |
| MpWebhookEvent (sanitizado) | forense pagamento | 2 anos |
| Fraud holds / disputes | antifraude | até resolução + retenção |

## Política de anonimização financeira

1. **Não apagar** linhas de ledger/payment/order com movimento.  
2. Anonimizar PII no User ligado: email→hash, nome→"ANON", telefone null.  
3. Manter `userId` opaco ou substituir por sentinel `deleted_user_*` com FK preservada.  
4. Mensagens: soft-delete / redact body.  
5. Export: gerar pacote do titular **sem** secrets/cartão.

## Teste sintético

Não executado E2E destrutivo nesta rodada.  
Classificação: **P1/P2 aberto** para E2E de anonimização com fixtures.
