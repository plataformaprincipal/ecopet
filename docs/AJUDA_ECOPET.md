# Ajuda EcoPet — Guia do usuário e requisitos técnicos

## Objetivo do site

O **EcoPet** é um ecossistema digital para o mercado pet: tutores (clientes), parceiros comerciais, ONGs e gestão da plataforma convivem em um único ambiente para comprar produtos, agendar serviços (banho, tosa e outros), acompanhar pedidos e gerenciar pets.

## Principais funcionalidades

- Cadastro e login por perfil (Cliente, Parceiro, ONG)
- Catálogo público de produtos e serviços
- Carrinho e checkout com pagamento na entrega (PIX, cartão ou dinheiro)
- Agendamento de serviços com calendário e modalidade (tele-busca ou entrega do pet)
- Painel do cliente: pedidos, agendamentos e pets
- Painel do parceiro: produtos, serviços, pedidos e agenda
- Recursos de acessibilidade: `alt` em imagens, formulários com rótulos e página demonstrativa

## Como cadastrar usuário

1. Acesse **Criar conta** (`/register`) ou `/login` → link de cadastro.
2. Escolha o tipo: **Cliente**, **Parceiro** ou **ONG** (botões de seleção / radio).
3. Preencha nome, e-mail, senha, telefone e dados específicos do perfil.
4. Após o cadastro, você é redirecionado ao dashboard do seu perfil.

Parceiros e ONGs têm acesso imediato após o cadastro (status ativo).

## Como criar produto (Parceiro)

1. Entre como parceiro → **Produtos** → **Criar produto** (`/dashboard/partner/products/new`).
2. Preencha nome, descrições, categoria, preço, estoque e demais campos.
3. Salve. O produto fica **ativo** e visível em `/produtos` para clientes.

## Como criar serviço (Parceiro)

1. Entre como parceiro → **Serviços** → **Criar serviço** (`/dashboard/partner/services/new`).
2. Informe nome, descrição, preço, duração, modalidade e local.
3. Salve. O serviço aparece em `/servicos` para agendamento.

## Catálogo inicial (bootstrap)

Para disponibilizar o catálogo operacional da EcoPet (7 produtos + 2 serviços):

```bash
npm run bootstrap:catalog
```

O script é idempotente e cria o parceiro institucional **EcoPet Oficial** sem exigir cadastro manual.

## Como comprar produto (Cliente)

1. Navegue em `/produtos` e abra o detalhe do item.
2. **Adicionar ao carrinho** → `/carrinho`.
3. **Finalizar** → `/checkout`.
4. Escolha entrega ou retirada e **forma de pagamento na entrega**: PIX, cartão ou dinheiro.
5. Confirme o pedido. O pagamento **não é cobrado online**; ocorre na entrega ou retirada.
6. Acompanhe em `/dashboard/client/orders`.

## Como agendar Banho ou Tosa

1. Acesse `/servicos` e escolha **Banho Pet** ou **Tosa Pet**.
2. Clique em **Agendar** (login necessário).
3. Selecione o pet (cadastre em `/dashboard/client/pets` se não tiver).
4. Escolha modalidade: **Tele-busca do pet** ou **Entrega do pet no local**.
5. Escolha data e horário disponível no calendário.
6. Confirme. Veja o agendamento em `/dashboard/client/appointments`.

## Como acompanhar pedido

- Lista: `/dashboard/client/orders`
- Detalhe: `/dashboard/client/orders/[orderId]`
- Status exibidos: aguardando confirmação, confirmado, em preparação, entrega, concluído, etc.
- Forma de pagamento escolhida no checkout fica registrada no pedido.

## Como acompanhar agendamento

- Lista: `/dashboard/client/appointments`
- Detalhe: `/dashboard/client/appointments/[appointmentId]`
- Exibe serviço, pet, data, horário, modalidade e status.

## Recursos de acessibilidade

- **Atributo `alt`**: imagens informativas têm descrição; decorativas usam `alt=""`.
- **Formulários**: rótulos (`label` + `htmlFor`), placeholders, `required`, `aria-describedby` para ajuda e erros.
- **Elementos variados**: text, email, number, password, checkbox, radio, select, textarea.
- **Página demonstrativa**: `/ajuda/formulario-acessivel` (formulário estático acadêmico).
- Skip link e foco visível no layout principal.

### Exemplos de `alt`

- `alt="Cachorro e gato representando o ecossistema EcoPet"`
- `alt="Imagem do produto Camiseta Pet Básica Conforto"`
- `alt="Imagem do serviço Banho Pet"`

## Elementos de formulário no sistema

| Página / fluxo | Elementos utilizados |
|----------------|----------------------|
| Cadastro (`/register`) | text, email, password, date, select implícito por role, labels |
| Checkout (`/checkout`) | text, tel, select, radio (pagamento), textarea, checkbox N/A |
| Produto parceiro | text, number, select, textarea, checkbox (retirada/entrega) |
| Serviço parceiro | text, number, select, textarea, radio (preço sob consulta) |
| Agendamento | select, radio (modalidade), date, botões de horário |
| Demo `/ajuda/formulario-acessivel` | todos os tipos listados no requisito acadêmico |

## Requisitos técnicos para rodar o projeto

- Node.js ≥ 20
- PostgreSQL (local ou Supabase)
- npm

## Comandos principais

```bash
npm install
npm run sync:env          # se disponível no projeto
npm run db:generate
npm run db:migrate:deploy
npm run bootstrap:catalog # catálogo inicial (opcional, recomendado)
npm run dev
```

Validação:

```bash
npm run type-check
npm run lint
npm run build
```

Testes de fundação (com servidor em execução):

```bash
npm run test:foundation:auth
npm run test:foundation:navigation
npm run test:foundation:catalog
```

## Estrutura do código-fonte

O código-fonte completo está na pasta do projeto:

```
ecopet/
├── package.json
├── README.md
├── docs/AJUDA_ECOPET.md    ← este arquivo
├── .env.example            ← variáveis sem segredos reais
├── apps/web/               ← frontend Next.js
├── apps/api/               ← API Express
├── packages/database/      ← Prisma + schema
├── scripts/                ← bootstrap, testes
└── public/                 ← assets estáticos
```

**Não versionar:** `.env`, `node_modules`, `.next`, credenciais reais.

## Links úteis no ambiente local

| Recurso | URL |
|---------|-----|
| Início | http://localhost:3000 |
| Produtos | http://localhost:3000/produtos |
| Serviços | http://localhost:3000/servicos |
| Formulário acessível (demo) | http://localhost:3000/ajuda/formulario-acessivel |

---

EcoPet — ecossistema pet inteligente. Documento de ajuda para entrega acadêmica e operação local.
