# FASE 6 — Estabilidade do checkout

## Funil auditado (código + E2E homolog)

```text
produto → carrinho → checkout → MP order → provider → webhook → pedido → parceiro → conclusão
```

## Métricas piloto real

Todas **N/A** (piloto não aberto).

## Métricas homolog / sandbox (qualitativas)

| Etapa | Evidência |
| ----- | --------- |
| Checkout create | E2E Fase 2 OK |
| Card token + Orders create | sandbox `accredited` OK |
| Confirmação via webhook natural | **FALHA** — assinatura |
| Confirmação via poll | existe no produto; **não** conta como prova 3.3 |
| Abandono / duplo clique / race | cobertos parcialmente por idempotency keys E2E; sem telemetria prod piloto |
| Preço divergente | negativado em Fase 2 (`neg_webhook_divergent_amount`) |
| Estoque | baixado em PAID (caminho webhook/poll) — natural não chega a PAID |

## Riscos estruturais

1. Dependência do webhook assinado para caminho oficial.  
2. Bypass Vercel na URL de notificação Preview.  
3. Sem kill switch global de checkout (só `PAYMENT_PROVIDER` / maintenance).

## MUST FIX antes de escala

- Fechar assinatura natural.  
- Separar env Preview/Prod.  
- Instrumentar taxas checkout/payment em produção piloto (quando houver).
