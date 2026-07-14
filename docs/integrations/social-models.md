# Social models — Post vs SocialPost

## Decisão

**Modelo autoritativo da rede social EcoPet: `SocialPost`** (e tabelas relacionadas: `SocialPostMedia`, `SocialPostLike`, `SocialComment`, etc.).

O modelo legado `Post` permanece no schema apenas para compatibilidade histórica e **não** deve receber novas features.

## Evidência

- Feed, comentários, curtidas, denúncias e APIs em `apps/web/src/lib/social/*` usam `prisma.socialPost`.
- Painéis admin/gestor/partner ERP já contam `socialPost`.

## Plano de migração seguro (sem apagar dados)

1. Congelar writes no modelo `Post` (nenhuma rota nova).
2. Inventariar linhas `Post` ainda referenciadas por UI/API.
3. Script de migração one-way: `Post` → `SocialPost` (mapear campos; marcar origem em metadata).
4. Validar contagens e amostras.
5. Soft-deprecate `Post` no schema (comentário + índice) e, em release futura, drop somente após backup.

## Feed

Enquanto não houver ranking real, o feed permanece **cronológico** (`createdAt desc`). Não rotular como “algoritmo inteligente”.

## IA social

Sugestões de legenda/hashtag/alt só quando OpenAI estiver configurada (`AI_ENABLED` + chave); caso contrário `AI_NOT_CONFIGURED`.
