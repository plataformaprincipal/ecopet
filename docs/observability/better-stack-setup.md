# Setup Better Stack

1. Crie uma Source em Better Stack → Logs
2. Copie **Source token** → `BETTER_STACK_SOURCE_TOKEN`
3. Copie **Ingesting host** → `BETTER_STACK_HOST` (com `https://`)
4. Opcional: Source ID / Region
5. Defina `BETTER_STACK_ENVIRONMENT`
6. Restart / redeploy
7. Admin → Observabilidade → **Enviar evento de teste**
8. Confira **Live tail**

## Uptime

Monitore `https://eccopet.com/api/health/live` (ou domínio oficial) — sem autenticação, sem side effects.

## Produção (Vercel)

Production / Preview / Development com as mesmas chaves **ou** Sources separadas no futuro. Sempre tag `environment` nos eventos.
