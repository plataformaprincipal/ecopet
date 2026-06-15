# APIs de chat legadas (deprecated)

As rotas abaixo permanecem por compatibilidade, mas **não devem ser usadas em código novo**.

| Legado | Sucessor |
|--------|----------|
| `GET/POST /api/chats` | `GET/POST /api/messages/conversations` |
| `GET/POST /api/chats/:id/messages` | `GET/POST /api/messages/conversations/:id/messages` |
| `GET/POST /api/conversations` | `GET/POST /api/messages/conversations` |
| `/social/mensagens` (UI) | `/dashboard/messages` |

Respostas das rotas Express incluem headers:

- `Deprecation: true`
- `Sunset: 2026-12-31`
- `Link: </api/messages/conversations>; rel="successor-version"`
