# Acesso ao painel administrativo EcoPet

## URL do painel

| Ambiente | URL |
|----------|-----|
| Produção | https://ecopet-web.vercel.app/admin |
| Local | http://localhost:3000/admin |

---

## Criar o primeiro administrador

### Opção A — Promover usuário existente (recomendado)

```bash
# Com variável de ambiente
ADMIN_CREATE_EMAIL=seu@email.com npm run admin:create

# Ou interativo (pede o e-mail no terminal)
npm run admin:create
```

O script:
1. Localiza o usuário pelo e-mail
2. Define `role = ADMIN` e `accountStatus = ACTIVE`
3. Cria `AdminProfile` se não existir
4. Registra `AuditLog`
5. Exibe a URL `/admin`

**Requisitos:** `DATABASE_URL` configurada (local ou produção via `.env`).

### Opção B — Criar admin do zero (bootstrap)

Somente quando **não existe nenhum ADMIN** no banco:

```bash
npm run admin:bootstrap
```

---

## Acessar em produção

1. Configure na Vercel:
   - `DATABASE_URL` (pooler Supabase `:6543?pgbouncer=true`)
   - `DIRECT_URL` (porta `:5432`, migrations)
   - `AUTH_SECRET` / `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL=https://ecopet-web.vercel.app`
2. Execute `npm run admin:create` apontando para o banco de produção (local com `.env` de prod) **ou** promova via Prisma Studio.
3. Acesse https://ecopet-web.vercel.app/login
4. Após login, você será redirecionado para `/admin`

---

## Regras de acesso

| Condição | Resultado |
|----------|-----------|
| Sem login | Redireciona para `/login?callbackUrl=/admin` |
| Role ≠ ADMIN | Redireciona para dashboard do perfil (`/client`, `/partner`, `/ngo`) |
| ADMIN com status ≠ ACTIVE | Redireciona para `/perfil` |
| ADMIN + ACTIVE | Acesso liberado a `/admin/*` |

O middleware protege todas as rotas `/admin/*`. As APIs em `/api/admin/*` validam sessão + role + status no backend.

---

## Aprovar parceiros e ONGs

1. Acesse **Admin → Aprovações** (`/admin/approvals`)
2. Abas: Parceiros pendentes · ONGs pendentes · Rejeitados · Suspensos
3. Para cada item:
   - **Aprovar** — `accountStatus → ACTIVE`, perfil `verificationStatus → APPROVED`, `AuditLog` + `Notification`
   - **Rejeitar** — exige motivo; `accountStatus → REJECTED`, `rejectionReason` salvo
   - **Suspender** — `accountStatus → SUSPENDED`

API equivalente: `PATCH /api/admin/accounts/:userId` com body `{ "action": "approve"|"reject"|"suspend", "reason": "..." }`

---

## Tabelas utilizadas

| Tabela | Uso |
|--------|-----|
| `User` | Role, `accountStatus`, dados base |
| `PartnerProfile` | Dados do parceiro, `verificationStatus`, `approvedAt`, `approvedById`, `rejectionReason` |
| `OngProfile` | Dados da ONG (mesmos campos de aprovação) |
| `ApprovalRequest` | Fila de aprovação no cadastro |
| `AuditLog` | Trilha de ações administrativas |
| `Notification` | Aviso in-app ao usuário aprovado/rejeitado |
| `PlatformSettings` | Configurações em `/admin/settings` |
| `Product`, `Service`, `Order`, `Appointment` | Marketplace e operações |
| `SocialReport`, `SocialPost` | Moderação social |

---

## Erros comuns

### "Acesso restrito a administradores" (403)

- Usuário logado não tem `role = ADMIN`
- Execute `npm run admin:create` com o e-mail correto

### Redirecionado para `/login`

- Sessão expirada — faça login novamente
- Cookie `ecopet-session` ausente

### Redirecionado para `/perfil` (admin)

- Conta ADMIN não está `ACTIVE` — verifique `accountStatus` no banco

### Parceiros pendentes não aparecem

- Confirme `DATABASE_URL` na Vercel apontando para o mesmo Supabase do cadastro
- Verifique `User.role = PARTNER` e `accountStatus = PENDING`

### DATABASE_UNAVAILABLE em produção

- Configure `DATABASE_URL` e `DIRECT_URL` na Vercel
- Use pooler `:6543?pgbouncer=true` para runtime serverless

---

## Comandos úteis

```bash
npm run admin:create          # Promover usuário a ADMIN
npm run admin:bootstrap       # Criar primeiro ADMIN (se nenhum existir)
npm run db:migrate:deploy     # Aplicar migrations (inclui campos de aprovação)
npm run test:admin-access     # Testes de permissão e fluxo de aprovação
npm run validate:env          # Validar variáveis de produção
```

---

## Estrutura do painel `/admin`

| Rota | Função |
|------|--------|
| `/admin` | Dashboard com métricas reais |
| `/admin/approvals` | Aprovação de parceiros e ONGs |
| `/admin/users` | Gestão de usuários |
| `/admin/marketplace` | Produtos e serviços |
| `/admin/orders` | Pedidos |
| `/admin/appointments` | Agendamentos |
| `/admin/social` | Posts e denúncias |
| `/admin/audit` | Logs de auditoria |
| `/admin/settings` | Configurações da plataforma |
