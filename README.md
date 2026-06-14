# ECOPET — Ecossistema Pet Inteligente

MVP profissional: **Super App Pet** com marketplace, rede social, prontuário digital, IA, adoção e múltiplas personas.

## Arquitetura

```
ecopet/
├── apps/
│   ├── web/          # Next.js 15 + TypeScript + Tailwind + Shadcn-style UI + Framer Motion
│   └── api/          # Node.js + Express + Socket.io + JWT
├── packages/
│   └── database/     # Prisma ORM + PostgreSQL
```

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Radix/Shadcn UI, Framer Motion, NextAuth |
| Backend | Node.js, Express, Prisma, Socket.io, Zod, JWT, Helmet, Rate Limit |
| Banco | PostgreSQL |
| Integrações | OpenAI, Stripe, Cloudinary, Google Maps (preparado via env) |

## Identidade visual

- Verde escuro `#1A3A2A` · Verde `#2E7D4F` · Amarelo `#F5C800` · Cinza `#4A4A5A`
- Tipografia: **Montserrat** + **Inter**
- UX premium: dark mode, skeleton loading, micro-animações

## Início rápido

### 1. PostgreSQL (local ou Supabase)

**Local com Docker:**

```bash
npm run db:up
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

**Supabase:** crie um projeto em [supabase.com](https://supabase.com), copie `DATABASE_URL` (pooler, porta 6543) e `DIRECT_URL` (porta 5432) para `.env`.

### 2. Instalar dependências

```bash
npm install
```

### 3. Banco de dados

```bash
npm run db:generate
npm run db:push    # dev rápido
# ou
npm run db:migrate # migrations versionadas
npm run db:seed
```

### 4. Rodar

```bash
npm run dev
```

- **Web:** http://localhost:3000  
- **API:** http://localhost:4000  
- **Browser → API:** proxy same-origin `/api/ecopet` (cookies HttpOnly)

Autenticação: **JWT access (15min) + refresh (7d)** em cookies HttpOnly. Senhas com **bcrypt** em `User.passwordHash`.

### Contas de demonstração (seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@ecopet.com.br | Ecopet@2026 |
| Tutor | tutor@ecopet.com.br | Ecopet@2026 |
| Veterinário | vet@ecopet.com.br | Ecopet@2026 |
| Pet Shop | loja@ecopet.com.br | Ecopet@2026 |

## Módulos do MVP

- Landing page premium
- Auth: login, cadastro, recuperação de senha, onboarding
- Dashboard com gamificação leve
- Feed social (posts, likes, hashtags)
- Marketplace (catálogo, produto, checkout)
- IA Pet com disclaimer veterinário obrigatório
- Perfil pet + prontuário (vacinas, exames, consultas)
- Adoção, veterinários, clínicas
- Chat (Socket.io), notificações, assinatura, configurações
- Painel administrativo

## Personas (RBAC preparado)

Tutor, Veterinário, Clínica, Pet Shop, ONG, Admin, Entregador, Influenciador, Parceiro.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Orquestrador: API (porta livre 4000+) + Web sincronizados |
| `npm run dev:parallel` | Web + API em paralelo (legado; pode causar EADDRINUSE) |
| `npm run dev:web` | Apenas frontend |
| `npm run dev:api` | Apenas backend |
| `npm run db:seed` | Dados de demonstração |

## Deploy (Vercel + API)

O frontend (`apps/web`) e a API (`apps/api`) são **serviços separados**. Na Vercel, só o Next.js roda por padrão — a API Express precisa de outro host (Railway, Render, Fly.io, etc.) ou o cadastro/login falhará com erro de conexão.

### Variáveis na Vercel (frontend)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | PostgreSQL remoto (SQLite não funciona na Vercel) |
| `JWT_SECRET` | Sim | Mesmo valor configurado na API |
| `NEXTAUTH_SECRET` | Sim | Segredo da sessão NextAuth |
| `NEXTAUTH_URL` | Sim | URL pública do site (ex.: `https://ecopet.vercel.app`) |
| `API_INTERNAL_URL` | Sim* | URL da API Express para proxy server-side |
| `NEXT_PUBLIC_API_URL` | Opcional | URL pública da API (alternativa ao proxy) |

\* Se `NEXT_PUBLIC_API_URL` **não** estiver definida, o frontend usa o proxy same-origin `/api/ecopet` (requer `API_INTERNAL_URL` no servidor).

### Variáveis na API (Railway/Render)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Mesmo Postgres da Vercel |
| `JWT_SECRET` | Mesmo valor do frontend |
| `WEB_URL` | URL do frontend (ex.: `https://ecopet.vercel.app`) |

### Gestor Véras (bootstrap)

Após `npm run db:seed`:

- **Usuário:** `gestorveras`
- **Senha:** `AASSSVVV@1972` (uso único — criar Master Admin em `/gestor/ativacao`)

## Próximos passos (produção)

1. Configurar `OPENAI_API_KEY`, `STRIPE_*`, `CLOUDINARY_*`, `GOOGLE_MAPS_API_KEY`
2. Migrations Prisma (`npm run migrate -w @ecopet/database`)
3. Deploy: Vercel (web) + Railway/Render (API + Postgres)
4. Upload real via Cloudinary nos formulários de cadastro

---

**ECOPET** — Cuidado, comunidade e inteligência para o universo pet. 🐾
