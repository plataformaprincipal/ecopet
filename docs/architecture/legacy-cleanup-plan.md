# Plano de cleanup de legados

| Item | Classificação | Ação |
|------|---------------|------|
| `/gestor` UI legado | KEEP_COMPATIBILITY | Manter até migração completa admin gestor |
| Express `gestor.ts` | DEPRECATED | Documentar; avaliar remoção pós-migração |
| `Post`/`Comment`/`Like` Prisma | DEPRECATED | Não usar em features novas |
| Express `/api/posts` | DEPRECATED | Headers deprecation ativos |
| Express `/api/chats` | DEPRECATED | Usar Next `/api/messages` |
| `/social/mensagens` | DEPRECATED | Redirect `/dashboard/messages` |
| `/inicio` | DEPRECATED | Redirect `/feed` |
| Stores Zustand antigas | REQUIRES_MANUAL_REVIEW | Auditar imports antes de remover |
| Mocks em `gestor-service.ts` Express | DEPRECATED | Substituído por gestor Next real |

## Removido nesta etapa

Nenhum arquivo legado removido automaticamente — apenas classificação e documentação.

## Critério para remoção futura

1. Zero referências no monorepo (`rg` / TypeScript)
2. Testes foundation passando sem a rota
3. Período de deprecation ≥ 1 release
