# Ambientes

`BETTER_STACK_ENVIRONMENT` (ou inferência `VERCEL_ENV` / `NODE_ENV`):

| Valor | Uso |
|---|---|
| `development` | Local |
| `test` | CI / vitest / node:test |
| `preview` | Vercel Preview |
| `production` | Produção |

Todos os eventos incluem `environment`, `service`, `release`, `region` (quando disponível).

Fonte única hoje é aceitável; separe Sources no futuro por ambiente sem mudar o código de tags.
