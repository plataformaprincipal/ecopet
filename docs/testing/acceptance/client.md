# Roteiro manual — CLIENT

| ID | Cenário | Esperado | Status |
|---|---|---|---|
| C-01 | Cadastro válido | ACTIVE + login | |
| C-02 | E-mail duplicado | 4xx | |
| C-03 | Senha fraca | 4xx | |
| C-04 | Login / logout | Sessão ok | |
| C-05 | Meu Pet CRUD | Persistência | |
| C-06 | IDOR pet | 403/404 | |
| C-07 | Agenda | CRUD + ownership | |
| C-08 | Marketplace + carrinho | Preço server | |
| C-09 | Checkout sandbox | Sem cartão real | |
| C-10 | Mensagens TalkJS Test | Sessão | |
| C-11 | Social post | CRUD próprio | |
| C-12 | Adoção interesse | Status | |
| C-13 | IA assistente | Sem diagnóstico | |
| C-14 | Notificações | Lista | |
| C-15 | Admin API | 403 | |

Automação: `e2e/acceptance/client.spec.ts` (subset)
