# Post-Deploy Smoke (não destrutivo)

Executar em Preview, depois Production.

| # | Teste | Esperado | Status Etapa 5 |
|---|-------|----------|----------------|
| 1 | HTTPS domínio | 200 | NÃO EXECUTADO |
| 2 | `/api/health/live` | 200 ok | NÃO EXECUTADO (local APROVADO) |
| 3 | `/api/health/ready` | 200 DB | NÃO EXECUTADO |
| 4 | Home / pré-visualização | 200 | NÃO EXECUTADO |
| 5 | Headers CSP/HSTS/XFO | presentes | NÃO EXECUTADO (local APROVADO) |
| 6 | Login controlado | sessão cookie | NÃO EXECUTADO |
| 7 | Logout | cookie limpo | NÃO EXECUTADO |
| 8 | RBAC redirect | 401/403/redirect | NÃO EXECUTADO |
| 9 | Marketplace público | catálogo | NÃO EXECUTADO |
| 10 | Social público | feed/preview | NÃO EXECUTADO |
| 11 | Upload autenticado | OK ou erro claro | NÃO EXECUTADO |
| 12 | Turnstile register/login | valida | NÃO EXECUTADO |
| 13 | 404 | página custom | NÃO EXECUTADO |
| 14 | Sem secrets no HTML/JS | spot check | NÃO EXECUTADO |

**Não** executar pagamento real nem delete de usuários reais.
