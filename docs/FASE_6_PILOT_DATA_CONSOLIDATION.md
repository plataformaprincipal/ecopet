# FASE 6 — Consolidação de dados do piloto

**Escopo de dados:** piloto **real = vazio**; evidência **homolog/sandbox** listada separadamente.  
**PII:** nenhum export de PII; IDs sanitizados.

---

## A. Piloto real (Production / dinheiro real)

| Métrica | Valor |
| ------- | ----- |
| Usuários cadastrados / ativos / compradores | 0 / 0 / 0 |
| Parceiros / ativos | 0 / 0 |
| Produtos ativos (piloto) | 0 |
| Pedidos iniciados / pagos / concluídos / cancelados / refundados | 0 |
| Pagamentos falhos / retries | 0 |
| Webhooks Production | não medidos (piloto não aberto) |
| Refunds / payouts / tickets / incidentes | 0 |
| Tempo médio resolução | N/A |

**Por dia / usuário / parceiro / categoria / método / status / origem:** dataset vazio.

---

## B. Evidência homolog/sandbox (pré-piloto)

| Dimensão | Observado |
| -------- | --------- |
| Cobranças sandbox Orders | múltiplas (Fase 2/3/3.3) — status provider `accredited` |
| Webhooks naturais Preview | **recebidos**; falha `SIGNATURE_MISMATCH` recorrente |
| Delay típico webhook | ~2–4s pós-charge |
| Duplicate delivery | ≥2 eventos por order observados |
| Polling como prova 3.3 | **proibido / não usado** no gate |
| Ledger após natural | não postado (assinatura rejeitada) |
| Refunds/payouts internos | cobertos por testes/E2E Fase 3, não por piloto real |
| Users homolog (ping anterior) | ~169 (ambiente de teste — **não** é base de piloto) |

### Distribuição de falha de pagamento (sandbox/natural)

| Código | Categoria | Frequência relativa |
| ------ | --------- | ------------------- |
| `SIGNATURE_MISMATCH` | ERRO CONFIGURAÇÃO / integração secret | **dominante** no canal natural |
| (provider accredited + app PROCESSING) | ERRO ECCOPET (gate assinatura) | acoplado ao acima |

---

## Conclusão

Não há dataset de piloto real para cohort, retenção ou unit economics.  
Qualquer decisão de escala baseada em “pedidos concluídos” seria **inválida**.
