# APIs de feed social legadas (deprecated)

As rotas Express abaixo permanecem por compatibilidade, mas **não devem ser usadas em código novo**.

## Rotas Express deprecadas

| Legado (Express) | Sucessor (Next.js) |
|----------------|-------------------|
| `GET /api/posts/feed` | `GET /api/social/feed` |
| `POST /api/posts/:id/like` | `POST /api/social/posts/:postId/like` |
| `DELETE /api/posts/:id/like` | `DELETE /api/social/posts/:postId/like` |

## Rotas que nunca existiram no Express

Estas rotas **não foram implementadas** no Express legado. Use apenas as APIs Next.js:

| Rota imaginada | Sucessor real |
|----------------|---------------|
| `/api/comments` | `GET/POST /api/social/posts/:postId/comments` |
| `/api/likes` | `POST/DELETE /api/social/posts/:postId/like` |

## UI

| Legado | Canônico |
|--------|----------|
| `/inicio` (feed legado) | `/feed` |
| `/social/salvos` | `/feed/saved` |
| `/social/post/[id]` | `/feed/post/[postId]` |

## Headers de depreciação

Respostas de `/api/posts/*` incluem:

- `Deprecation: true`
- `Sunset: 2026-12-31`
- `Link: </api/social/feed>; rel="successor-version"`
- `X-EcoPet-Deprecated: Use /api/social/* — ver docs/api/social-deprecation.md`

## Modelos de dados

Ver [social-legacy-models.md](../social-legacy-models.md) para `Post`/`Comment`/`Like` vs `Social*`.
