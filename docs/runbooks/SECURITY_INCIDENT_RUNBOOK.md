# Runbook — Incidentes de segurança

## Token / secret vazado
1. Rotacionar imediatamente no provedor (MP, Supabase, Vercel, NEXTAUTH).
2. Invalidar sessões se JWT/session afetado.
3. Auditar logs de acesso.
4. Não commitar valor rotacionado em docs.

## Conta admin comprometida
1. Suspender usuário admin.
2. Rotacionar senha + sessões.
3. Revisar AuditLog de ações financeiras.
4. Freeze payouts se houver mutação suspeita.

## Webhook falso / bypass vazado
1. Rotacionar `VERCEL_AUTOMATION_BYPASS_SECRET` e URL no painel MP.
2. Rotacionar `MERCADO_PAGO_WEBHOOK_SECRET`.
3. Redeploy Preview.
4. Revisar `MpWebhookEvent` FAILED recentes.

## Fraude / abuso
1. fraudHold / fulfillmentBlocked em orders.
2. Suspender parceiro/cliente.
3. Chargeback INTERNO CONTROLADO se necessário.

## Data breach
1. Contenção (revogar tokens, isolar Preview se origem Preview).
2. Avaliar notificação LGPD (base legal / prazo).
3. Preserve logs; não wipe evidência.
