# Modelos sociais legados vs canônicos

A Etapa 11 introduziu o módulo **Social*** como fonte de verdade do feed. Modelos antigos permanecem no schema por compatibilidade com código legado (gestor, Express).

## Legado (não usar em código novo)

| Modelo Prisma | Uso histórico | Limitações |
|---------------|---------------|------------|
| `Post` | Feed Express `/api/posts/feed` | Sem moderação rica, mídia em JSON, sem shares model |
| `Comment` | Nunca exposto via API | Sem respostas, sem moderação |
| `Like` | `POST /api/posts/:id/like` | Apenas post, sem comment likes |
| `SavedPost` | UI local apenas | Não conectado ao feed novo |
| `Follow` | UI local apenas | Substituído por `UserFollow` no módulo social |
| `PostHashtag` | Join com `Hashtag.tag` | Substituído por `SocialPostHashtag` + `Hashtag.slug` |

## Canônico (Etapa 11)

| Modelo | Finalidade |
|--------|------------|
| `SocialPost` | Publicações do feed |
| `SocialComment` | Comentários e respostas |
| `SocialPostLike` | Curtidas em posts |
| `SocialCommentLike` | Curtidas em comentários |
| `SocialPostSave` | Posts salvos |
| `SocialPostShare` | Compartilhamentos internos |
| `SocialReport` | Denúncias sociais |
| `PublicProfile` | Perfil público sem dados sensíveis |
| `UserFollow` | Seguidores |
| `UserSocialBlock` | Bloqueio social |

## Risco de usar modelo errado

- **Dados duplicados:** posts criados em `Post` não aparecem em `/api/social/feed`.
- **Moderação inconsistente:** gestor legado pode ocultar `Post`; admin social modera `SocialPost`.
- **IDs incompatíveis:** curtidas em `Like` não refletem em `SocialPostLike`.

## Plano futuro de remoção

1. **Fase A (atual):** APIs Express deprecadas com headers; UI canônica em `/feed`.
2. **Fase B:** Migrar gestor/moderation de `ContentReport` + `Post` para `SocialReport` + `SocialPost`.
3. **Fase C:** Remover rotas Express `/api/posts` após período Sunset (2026-12-31).
4. **Fase D:** Migration para arquivar tabelas `Post`, `Comment`, `Like` se vazias em produção.

**Regra:** todo código novo deve usar `prisma.socialPost`, `prisma.socialComment` e APIs `/api/social/*`.
