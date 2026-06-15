# Frontend — Auditoria Etapa 13

## Rotas

- Públicas: `/`, `/login`, `/cadastro`, `/legal/*`, marketplace catálogo
- Privadas: `/dashboard/*` por role
- Admin: `/dashboard/admin/*`, `/dashboard/admin/gestor/*`

## Navegação

- Menu filtrado por `ROLE_ROUTE_PREFIXES` e `ROLE_DENIED_PREFIXES`
- ADMIN não vê `/meu-pet`, `/feed` no menu principal (by design)

## Estados

- Empty states em marketplace, feed, gestor
- Loading em painéis gestor client-side
- Erros API sem stack trace no UI

## Mobile

- Layout responsivo Tailwind; sidebar gestor com scroll

## Pendências

- Página 403 dedicada (usa redirect hoje)
- Revisão completa mobile em todas as rotas partner

## Checklist

- [x] Menu admin restrito
- [x] Dados sensíveis não no HTML público
- [x] Redirects legados (`/privacidade` → `/legal/privacidade`)
