# ECOPET — Ecossistema Pet Inteligente

Plataforma profissional para tutores, parceiros, ONGs e gestão AgroPet. Monorepo TypeScript com Next.js 15, Express e PostgreSQL.

## Ajuda e acessibilidade

- **Guia completo:** [docs/AJUDA_ECOPET.md](docs/AJUDA_ECOPET.md) — cadastro, produtos, serviços, pedidos, agendamentos e requisitos técnicos.
- **Manual do usuário:** [docs/MANUAL_DO_USUARIO.md](docs/MANUAL_DO_USUARIO.md) — passo a passo para tutores e clientes.
- **Formulário demonstrativo (acessibilidade):** [http://localhost:3000/ajuda/formulario-acessivel](http://localhost:3000/ajuda/formulario-acessivel) — página estática com todos os tipos de campo exigidos (text, email, number, password, checkbox, radio, select, textarea).

## Execução local (resumo)

```bash
npm install
cp .env.example .env          # editar credenciais locais (nunca commitar .env)
npm run db:generate
npm run db:migrate:deploy     # ou npm run db:push em dev
npm run bootstrap:catalog     # catálogo inicial (opcional)
npm run dev
```

- **Web:** http://localhost:3000  
- **API:** http://localhost:4000

Validação: `npm run type-check` · `npm run lint` · `npm run build`

## Arquitetura

```
ecopet/
├── apps/
│   ├── web/          # Next.js 15 + TypeScript + Tailwind + Radix UI
│   └── api/          # Express 5 + Socket.io + JWT
├── packages/
│   └── database/     # Prisma ORM + PostgreSQL
├── docs/             # Documentação técnica
└── scripts/          # Automação e testes
```

Documentação detalhada: [docs/architecture.md](docs/architecture.md)

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS 4, Radix UI, Framer Motion |
| Backend | Node.js 20+, Express 5, Prisma, Socket.io, Zod, JWT |
| Banco | PostgreSQL |
| Auth | Cookies HttpOnly, bcrypt, RBAC por role |

## Estrutura do frontend (`apps/web/src`)

```
src/
├── app/              # Rotas e API routes
├── components/
│   ├── ui/           # Primitivos de interface
│   ├── layouts/      # Shell, sidebar, header
│   ├── shared/       # Brand, acessibilidade, navegação
│   └── features/     # Módulos de domínio
├── services/         # Clientes HTTP
├── lib/              # Lógica de negócio
├── schemas/          # Validação Zod
├── types/            # Tipos centralizados
├── constants/        # Constantes globais
├── hooks/            # React hooks
├── providers/        # Context providers
├── store/            # Zustand
├── styles/           # CSS global
└── middleware.ts     # Auth + RBAC
```

## Banco de dados e Prisma

**Fonte única:** `packages/database/prisma/schema.prisma` (PostgreSQL)

O web e a API compartilham o mesmo Prisma Client via `@ecopet/database`.

```bash
npm run db:generate    # Regenera @prisma/client
npm run db:push        # Dev rápido (sem migration)
npm run db:migrate     # Migrations versionadas
npm run db:studio      # Interface visual
npm run type-check     # Valida database + web + api
```

### Variáveis obrigatórias (produção)

| Variável | Workspace | Descrição |
|----------|-----------|-----------|
| `DATABASE_URL` | todos | PostgreSQL (pooler) |
| `DIRECT_URL` | database | Conexão direta para migrations |
| `AUTH_SECRET` | web | Sessão JWT local |
| `NEXTAUTH_SECRET` | web | NextAuth |
| `JWT_SECRET` | api | Tokens API |

Integrações (`OPENAI_API_KEY`, `MERCADO_PAGO_*`, `CLOUDINARY_*`, `RESEND_API_KEY`) são opcionais em dev.

## Instalação

### Pré-requisitos

- Node.js ≥ 20
- PostgreSQL (local via Docker ou remoto)

### Setup

```bash
# 1. Clonar e instalar
git clone <repo>
cd ecopet
npm install

# 2. Configurar ambiente
cp .env.example .env
# Editar .env com credenciais reais

# 3. Banco de dados
npm run db:up          # Docker PostgreSQL (opcional)
npm run db:generate
npm run db:push

# 4. Desenvolvimento
npm run dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:4000

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Orquestrador web + API |
| `npm run dev:web` | Apenas frontend |
| `npm run dev:api` | Apenas backend |
| `npm run build` | Build de produção (web) |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript (web + api) |
| `npm run test` | Suite de testes |
| `npm run db:generate` | Gerar Prisma Client (`@ecopet/database`) |
| `npm run db:push` | Sincronizar schema (dev) |
| `npm run db:migrate` | Migrations versionadas |
| `npm run db:studio` | Prisma Studio |
| `npm run type-check` | TypeScript (database + web + api) |

## Build e deploy

```bash
npm run lint
npm run type-check
npm run build
```

### Variáveis obrigatórias (produção)

| Variável | App | Descrição |
|----------|-----|-----------|
| `DATABASE_URL` | web, api | PostgreSQL |
| `AUTH_SECRET` | web | Sessão JWT |
| `NEXTAUTH_SECRET` | web | NextAuth |
| `JWT_SECRET` | api | Tokens API |
| `API_INTERNAL_URL` | web | Proxy para API |
| `WEB_URL` | api | CORS origin |

Ver `.env.example` para lista completa.

## Convenções

- **Componentes:** PascalCase em `components/features/{domínio}/`
- **Schemas:** Zod em `schemas/`
- **Tipos:** Centralizados em `types/`
- **API clients:** `lib/{domínio}/api.ts` (re-exportados em `services/`)
- **Rotas:** Português, kebab-case (`/meu-pet`, `/configuracoes`)

## Segurança

- Segredos via `process.env` — validados em produção por `lib/env.ts`
- Cookies HttpOnly com `sameSite: lax`
- Rate limiting em rotas de auth
- Nunca commitar `.env` ou credenciais

## Acessibilidade

Fundação global com skip link, toolbar de acessibilidade, foco visível, HTML semântico e suporte a leitores de tela. Imagens com `alt` descritivo, formulários com rótulos associados e página demonstrativa em `/ajuda/formulario-acessivel`. Documentação: [docs/AJUDA_ECOPET.md](docs/AJUDA_ECOPET.md).

## Identidade visual

- Verde `#003B16` · Verde secundário `#0F5A2A` · Amarelo `#F5C800`
- Tipografia: Inter + Plus Jakarta Sans
- Dark mode nativo

---

**ECOPET** — Fundação profissional para o ecossistema pet inteligente.
