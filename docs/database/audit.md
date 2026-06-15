# Auditoria Prisma / Banco — EcoPet

## Modelos canônicos (Etapa 13)

| Domínio | Modelo canônico |
|---------|-----------------|
| Usuários | `User` + perfis (`PartnerProfile`, `OngProfile`, …) |
| Pets | `Pet` |
| Marketplace | `Product`, `Service`, `Order`, `OrderItem` |
| Pagamentos | `Payment`, `PaymentEvent` (registro; gateway opcional) |
| Social | `SocialPost`, `SocialComment`, `SocialReport` |
| Mensagens | `Conversation`, `Message` |
| Suporte | `SupportTicket` |
| Auditoria | `AuditLog` |
| Integrações | `PlatformIntegrationLog` |
| LGPD | `DataPrivacyRequest` (Etapa 13) |

## Modelos legados (KEEP_COMPATIBILITY)

| Modelo | Status | Plano |
|--------|--------|-------|
| `Post`, `Comment`, `Like` | DEPRECATED | Remover após migração completa para `Social*` |
| Express `/api/posts` | DEPRECATED | Headers deprecation; usar `/api/social/*` |
| Express `/api/chats` | DEPRECATED | Usar `/api/messages/*` |
| `/gestor` legado | KEEP_COMPATIBILITY | Coexiste com `/dashboard/admin/gestor` |

## Índices críticos

- `User.email`, `User.cpf`, `User.cnpj` — unique
- `AuditLog` — `createdAt`, `module`
- `SocialReport.status`
- `SupportTicket.status, priority`
- `DataPrivacyRequest.userId, status`

## Campos sensíveis

- `User.passwordHash` — nunca expor em API
- `User.cpf`, `cnpj` — mascarar em listagens admin
- `AuditLog.metadata` — sanitizar secrets

## Migrations

Aplicar em produção:

```bash
npm run db:migrate:deploy
```

Nunca apagar migrations versionadas.
