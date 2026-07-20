# Integrações da IA de Negócio

Integração **desacoplada** — sem alterar regras de negócio das plataformas abaixo.

| Sistema | Uso pela IA |
|---------|-------------|
| Prisma / Supabase | Via services existentes / adaptadores de leitura |
| Marketplace | `queryPublicProducts/Services/Partners` |
| Carrinho | `getOrCreateCart` + `serializeCart` |
| Meu Pet | `buildPetOsOverview` |
| Agenda | leitura de appointments autorizados |
| Parceiros / ONGs | `buildPartnerDashboardSummary` / `buildOngDashboardSummary` |
| Notificações | `listNotifications` / `getUnreadCount` |
| Social | `searchSocial` |
| OpenAI | Provider/stream da fundação |
| GA / GTM / MP / Firebase / Maps / Cloudinary / Resend / TalkJS | Não alterados; IA não muda fluxos |

Cache: abstração in-memory (`modules/cache.ts`) pronta para Redis.
