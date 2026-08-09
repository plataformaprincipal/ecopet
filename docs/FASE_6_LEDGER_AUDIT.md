# FASE 6 — Ledger audit

## Escopo

| Conjunto | Resultado |
| -------- | --------- |
| 100% pedidos **piloto real** | **N/A — 0 pedidos** |
| Pedidos sandbox com webhook natural rejeitado | Payment `PROCESSING`, ledger **0** — esperado sob fail-closed |
| E2E Fase 3 (homolog, ciclo anterior) | ledger/payout/refund internos **16/16** |
| Concurrency hardening | 1 insert + P2002; sem `PAYMENT_RECEIVED` dup |

## Recálculo pedido a pedido (piloto)

```text
Nenhum pedido piloto para Order→Payment→Ledger→Reserve→Refund→Payout.
```

## Exceções

| ID | Descrição | Status |
| -- | --------- | ------ |
| LEX-001 | Natural path não postou ledger (assinatura) | bloqueador externo |
| LEX-002 | Patches recon/ledger no working tree não em HEAD remoto | risco de drift |

## Veredito

```text
LEDGER PILOTO: NÃO APLICÁVEL (0 pedidos)
LEDGER HOMÓLOGO INTERNO: CONSISTENTE NAS PROVAS ANTERIORES
100% RECONCILIADO (piloto real): IMPOSSÍVEL — SEM DADOS
```
