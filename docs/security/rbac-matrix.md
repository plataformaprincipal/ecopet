# Matriz RBAC — EcoPet

| Rota / API | Roles | Status conta | Dados expostos | Risco |
|------------|-------|--------------|----------------|-------|
| `/dashboard/admin/*` | ADMIN | ACTIVE | métricas agregadas | Alto — bloqueado middleware |
| `/api/admin/*` | ADMIN | ACTIVE | listagens mascaradas | Alto |
| `/dashboard/admin/gestor/*` | ADMIN | ACTIVE | BI real, CPF/CNPJ mascarados | Alto |
| `/dashboard/client/*` | CLIENT | ACTIVE/PENDING* | próprios pets/pedidos | Médio |
| `/dashboard/partner/*` | PARTNER | ACTIVE | próprios produtos/serviços | Médio |
| `/dashboard/ong/*` | ONG | ACTIVE | perfil ONG | Médio |
| `/api/client/pets/*` | CLIENT | ACTIVE | pets do `ownerId` | IDOR — filtro por dono |
| `/api/client/orders/*` | CLIENT | ACTIVE | pedidos do comprador | IDOR — filtro por userId |
| `/api/messages/conversations/*` | autenticado | ACTIVE | participante apenas | IDOR — membership check |
| `/feed`, `/api/social/*` | autenticado** | ACTIVE | posts públicos/seguidos | Baixo-médio |
| `/marketplace/produtos` | público | — | catálogo público | Baixo |
| `/legal/*` | público | — | texto legal | Nenhum |
| `/api/account/export-data` | autenticado | ACTIVE | próprios dados mascarados | LGPD |

\* PENDING: acesso limitado por `canAccessWithAccountStatus`  
\*\* Feed requer login na configuração atual

## Bloqueios por status

| Status | Comportamento |
|--------|---------------|
| PENDING | Acesso parcial; sem marketplace completo |
| REJECTED | Bloqueado — redirect suporte |
| SUSPENDED | Bloqueado — redirect suporte |

## Testes

- `npm run test:permissions`
- `npm run test:security`
- `npm run test:foundation:gestor`
