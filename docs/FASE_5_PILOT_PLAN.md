# FASE 5 — Plano de Piloto Real Controlado (sem execução)

**Status:** planejamento somente — **execução bloqueada**  
**Veredito atual:** ver `FASE_5_PILOT_RESULTADO.md`

---

## Objetivo (5.1)

Provar confiabilidade, operação, pagamento, parceiro, suporte, refund e financeiro — **não** crescimento.

## Escopo (5.2)

≤20 users · ≤3 partners · ≤10 orders/day · ≤R$500 GMV/day · ≤R$100/order · payout manual · 1 região · 7–14 dias.

## Parceiros (5.3)

Documentação válida · responsável · contato rápido · catálogo pequeno · estoque confiável · aceite formal · **sem** parceiro grande/crítico.

## Clientes (5.4)

Convidados / equipe / conhecidos — sem abertura pública; consentimento quando necessário.

## Produtos (5.5)

Poucos SKUs baixo valor, refund fácil. Evitar medicamentos, regulados, alto valor, logística complexa, cross-border.

## Pagamentos / payout / reserve (5.6–5.8)

Dia 1: limite mínimo; monitorar cada tx.  
`PAYOUTS_ENABLED=false` + aprovação manual quando habilitar.  
Reserve conservadora; não liberar 100% imediato.

## Monitoramento / fechamento (5.9–5.10)

Checklist por pedido + fechamento diário (template `docs/pilot/PILOT_DAILY_TEMPLATE.md`).

## Stop / incidente (5.11–5.12)

Stop: double charge, ledger dup, PAID indevido, payout errado, mismatch, fraude, vazamento, auth bypass, DB/provider down.  
P0: desabilitar pagamentos → congelar payouts → preservar dados → incidente → reconciliar → corrigir → auth para reabrir.

## Support / métricas / economics (5.13–5.18)

Tickets com SLA; métricas operacionais (não vanity); unit economics por pedido; CAC só se paid acquisition; partner economics; minutes/order.

## Scale / exit (5.20–5.22)

Review 7 dias; escala 20→50→100 users etc. só com evidência.  
Exit: zero P0, recon OK, payments/refunds/ledger OK, suporte administrável, sem perda $ inexplicada.

## Pré-requisitos para autorização de execução

- [ ] FASE 3.3 concluída (webhook natural assinado)  
- [ ] FASE 4 não bloqueada  
- [ ] `PRODUCTION_ENVIRONMENT_READY`  
- [ ] Autorização humana explícita para 1º pagamento real  
