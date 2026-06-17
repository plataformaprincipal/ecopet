# Manual do Usuário — EcoPet

Guia completo para tutores, parceiros e visitantes da plataforma EcoPet.

---

## 1. Visão geral do EcoPet

O **EcoPet** é um ecossistema digital para o mercado pet. Na mesma plataforma você pode:

- Comprar produtos (ração, acessórios, higiene e mais)
- Agendar serviços como **Banho Pet** e **Tosa Pet**
- Cadastrar pets e acompanhar pedidos e agendamentos
- Gerenciar loja e serviços (perfil Parceiro)

**Perfis de acesso:** Cliente (tutor), Parceiro, ONG e Gestão.

**URLs locais (desenvolvimento):**

| Página | Endereço |
|--------|----------|
| Início | http://localhost:3000 |
| Produtos | http://localhost:3000/produtos |
| Serviços | http://localhost:3000/servicos |
| Login | http://localhost:3000/login |
| Cadastro | http://localhost:3000/register |
| Ajuda acessibilidade | http://localhost:3000/ajuda/formulario-acessivel |

Documentação técnica complementar: [AJUDA_ECOPET.md](AJUDA_ECOPET.md)

---

## 2. Como criar conta

1. Acesse **Cadastro** (`/register` ou `/cadastro`).
2. Escolha o tipo de conta: **Cliente**, **Parceiro** ou **ONG** (botões de seleção).
3. Preencha:
   - Nome completo
   - E-mail (`type="email"`)
   - Senha e confirmação (`type="password"`)
   - Telefone
   - Dados específicos do perfil (CNPJ para parceiro/ONG, data de nascimento para cliente)
4. Clique em **Cadastrar**.
5. Você será redirecionado ao painel do seu perfil.

---

## 3. Como fazer login

1. Acesse `/login`.
2. Informe **e-mail** e **senha**.
3. Clique em **Entrar**.
4. Se veio de um link (ex.: agendar serviço), você retorna automaticamente à página solicitada.

**Esqueci a senha:** `/esqueci-senha` — informe o e-mail cadastrado.

---

## 4. Como cadastrar pet

1. Entre como **Cliente**.
2. Vá em **Meus pets** → `/dashboard/client/pets`.
3. Clique em **Cadastrar pet** (`/dashboard/client/pets/new`).
4. Preencha nome, espécie, raça, data de nascimento e demais campos.
5. Salve.

> O pet é obrigatório para agendar banho ou tosa.

---

## 5. Como comprar produtos

1. Acesse `/produtos`.
2. Navegue pelo catálogo (7 produtos iniciais após `npm run bootstrap:catalog`).
3. Abra o detalhe do item desejado.
4. Clique em **Adicionar ao carrinho**.
5. Continue comprando ou vá ao carrinho.

**Catálogo inicial:** execute `npm run bootstrap:catalog` para disponibilizar produtos e serviços da EcoPet Oficial.

---

## 6. Como usar o carrinho

1. Acesse `/carrinho` ou `/marketplace/carrinho`.
2. Revise itens, quantidades e valores.
3. Ajuste quantidades com **+** e **−**.
4. Remova itens indesejados.
5. Clique em **Finalizar** para ir ao checkout.

**Regra:** apenas um parceiro por pedido. Se houver itens de lojas diferentes, remova os extras antes de finalizar.

---

## 7. Como finalizar pedido

1. No checkout (`/checkout`), escolha:
   - **Retirada na loja** ou **Entrega local**
   - **Pagamento na entrega:** PIX, Cartão ou Dinheiro (não há cobrança online imediata)
2. Preencha telefone e endereço (quando entrega).
3. Adicione observações se necessário.
4. Confirme o pedido.
5. Anote o número do pedido na tela de sucesso.

---

## 8. Como acompanhar pedido

1. Acesse `/dashboard/client/orders`.
2. Veja a lista com status: aguardando confirmação, em preparação, entrega, concluído, etc.
3. Clique em **Ver** para detalhes: itens, total, forma de pagamento e histórico.
4. Pedidos pendentes podem ser **cancelados** pelo cliente.

---

## 9. Como agendar banho

1. Acesse `/servicos` e escolha **Banho Pet**.
2. Clique em **Agendar** (login necessário).
3. Selecione o **pet** cadastrado.
4. Escolha a **modalidade** (tele-busca ou entrega no local).
5. No **calendário**, selecione uma data (segunda a sábado; domingos bloqueados).
6. Escolha um **horário disponível** (intervalos de 60 minutos, 08:00–18:00).
7. Confirme o agendamento.

---

## 10. Como agendar tosa

Mesmo fluxo do banho, escolhendo **Tosa Pet** em `/servicos`.

- Duração: **90 minutos**
- Horários conforme disponibilidade do parceiro (08:00–18:00, seg–sáb)

---

## 11. Como escolher tele-busca

Na tela de agendamento, selecione **Tele-busca do pet**.

Preencha obrigatoriamente:

- **Endereço** — onde buscar o pet
- **Complemento** (opcional)
- **Ponto de referência** (opcional)
- **Telefone** de contato

A equipe irá até o endereço no horário agendado.

---

## 12. Como escolher entrega no local

Selecione **Entrega do pet no local**.

O sistema exibe:

- Nome da unidade parceira
- Endereço completo
- Horário de funcionamento
- Orientações de chegada

Leve o pet até o local no horário marcado.

---

## 13. Como cancelar agendamento

1. Acesse `/dashboard/client/appointments`.
2. Abra o agendamento desejado.
3. Clique em **Cancelar agendamento** (disponível enquanto não estiver concluído ou já cancelado).
4. O status muda para **Cancelado**.

---

## 14. Recursos de acessibilidade

O EcoPet segue boas práticas de acessibilidade (WCAG 2.1 AA):

- **Imagens** com `alt` descritivo (sem textos genéricos como “foto” ou “produto” isolados)
- **Formulários** com `label`, `htmlFor`, `id`, placeholders e `aria-describedby`
- **Skip link** e foco visível no layout
- **Página demonstrativa:** `/ajuda/formulario-acessivel`
- **Leitores de tela:** estrutura semântica, mensagens de erro com `role="alert"`

Exemplos de `alt`:

- `Cama Pet Almofadada Lavável: Cama confortável, lavável e indicada para descanso diário.`
- `Serviço de banho pet com agendamento online`

---

## 15. Contato e suporte

- **Suporte na plataforma:** `/dashboard/support` (clientes) ou painel do parceiro
- **Documentação técnica:** [docs/AJUDA_ECOPET.md](AJUDA_ECOPET.md)
- **Arquitetura:** [docs/architecture.md](architecture.md)

Para rodar o projeto localmente:

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate:deploy
npm run bootstrap:catalog
npm run dev
```

---

*EcoPet — Ecossistema Pet Inteligente. Manual do usuário — Fase 11.*
