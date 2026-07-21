# Loading & Skeletons

## InstitutionalLoader

`apps/web/src/components/shared/brand/institutional-loader.tsx`

- Símbolo da marca + progresso discreto
- Superfícies `dark` | `light`
- Sem texto cru “Carregando...”
- Usado em `apps/web/src/app/loading.tsx`

## Skeleton system

`apps/web/src/components/skeletons/`

- PageSkeleton, CardSkeleton, ListSkeleton, FeedSkeleton
- MarketplaceSkeleton, ProfileSkeleton, ChatSkeleton
- AdminDashboardSkeleton, TableSkeleton, FormSkeleton, PetCardSkeleton

## Regras

- Dimensões próximas ao conteúdo real
- Shimmer com `prefers-reduced-motion`
- Dark mode suportado
- Não alterar Suspense/fetch — só apresentação
