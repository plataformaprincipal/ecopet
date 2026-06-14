# Status de conta autoritativo (Etapa 5)

## Estratégia

1. **Banco de dados** é a fonte autoritativa de `accountStatus` e `role`.
2. **JWT** (`ecopet-session`) carrega `accountStatus` para decisões rápidas em rotas públicas.
3. **Rotas críticas** consultam o banco via `GET /api/auth/session-check` no middleware.
4. Quando JWT diverge do banco, `session-check` emite novo cookie com status atualizado.
5. **APIs** (`/api/client/*`, `/api/partner/*`, `/api/admin/*`) sempre validam via `requireAuth()` → DB.

## Rotas com verificação autoritativa

- `/dashboard/*`
- `/api/client/*`, `/api/partner/*`
- `/meu-pet`, `/agenda`
- Prefixos comerciais bloqueados para PENDING

## Rotas sem consulta DB no middleware

- Páginas públicas (`/`, `/login`, marketplace anônimo)
- Assets estáticos

## Após aprovação ADMIN

O parceiro aprovado acessa áreas permitidas na **próxima navegação** sem limpar cookies manualmente.
