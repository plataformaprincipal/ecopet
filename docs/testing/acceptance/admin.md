# Roteiro manual — ADMIN

| ID | Cenário | Esperado | Status |
|---|---|---|---|
| A-01 | Login ADMIN | Dashboard | |
| A-02 | CLIENT → /admin | Bloqueio | |
| A-03 | Aprovar partner/ONG | Status + notificação | |
| A-04 | Suspender usuário | Bloqueio login | |
| A-05 | Moderação | Remoção auditada | |
| A-06 | Observability | Health sem token | |
| A-07 | Evento teste Better Stack | correlationId | |
| A-08 | Feature flags | Rollback | |

Automação: `e2e/acceptance/admin-gates.spec.ts` (+ `ADMIN_TEST_EMAIL`)
