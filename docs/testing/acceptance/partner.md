# Roteiro manual — PARTNER

| ID | Cenário | Esperado | Status |
|---|---|---|---|
| P-01 | Cadastro | 201 + verification PENDING se regra | |
| P-02 | Funções pré-aprovação | Restrição conforme regra | |
| P-03 | Produtos CRUD | Ownership | |
| P-04 | IDOR produto outro partner | 403 | |
| P-05 | Pedidos | Aceitar/atualizar | |
| P-06 | Agenda serviços | Conflito | |
| P-07 | Financeiro | Dados próprios | |
| P-08 | TalkJS | Conversa contextual | |
| P-09 | IA parceiro | Sem auto-publish | |
| P-10 | Admin | 403 | |
| P-11 | Suspensão | Bloqueio vendas | |

Automação: `e2e/acceptance/partner-ngo.spec.ts`
