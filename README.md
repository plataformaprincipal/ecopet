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

### 1. PostgreSQL

Crie o banco `ecopet` e copie o env:

```bash
cp .env.example .env
# Edite DATABASE_URL
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Banco de dados

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Rodar

```bash
npm run dev
```

- **Web:** http://localhost:3000  
- **API:** http://localhost:4000  

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
| `npm run dev` | Web + API em paralelo |
| `npm run dev:web` | Apenas frontend |
| `npm run dev:api` | Apenas backend |
| `npm run db:seed` | Dados de demonstração |

## Próximos passos (produção)

1. Configurar `OPENAI_API_KEY`, `STRIPE_*`, `CLOUDINARY_*`, `GOOGLE_MAPS_API_KEY`
2. Migrations Prisma (`npm run migrate -w @ecopet/database`)
3. Deploy: Vercel (web) + Railway/Render (API + Postgres)
4. Upload real via Cloudinary nos formulários de cadastro

---

**ECOPET** — Cuidado, comunidade e inteligência para o universo pet. 🐾
