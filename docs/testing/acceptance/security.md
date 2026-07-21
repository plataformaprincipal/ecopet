# Segurança — aceitação

| ID | Tipo | Cenário | Esperado | Status |
|---|---|---|---|---|
| SEC-01 | IDOR | Pet/order alheio | 403/404 | Auto parcial |
| SEC-02 | RBAC | CLIENT→admin | 403 | Auto |
| SEC-03 | Headers | nosniff | Presente | Auto |
| SEC-04 | Login enum | Mensagem genérica | INVALID_CREDENTIALS | Auto parcial |
| SEC-05 | Rate limit | Brute force | 429 | Manual/CI |
| SEC-06 | Webhook MP | Sem secret em prod | 503 | Code review |
| SEC-07 | Secrets logs | Redaction | Sem token | Unit obs |
| SEC-08 | XSS/CSRF | Manual controlado | Sem execução | Manual |

Automação: `e2e/acceptance/admin.spec.ts`, `client.spec.ts`, `scripts/test-security.mjs` (server required)
