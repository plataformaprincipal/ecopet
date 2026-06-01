# Checklist de Testes — Fase 3 (Homologação Técnica)

Use este roteiro para validar manualmente a ECOPET antes da homologação. Marque **OK**, **Parcial** ou **Falha** em cada item.

**Ambiente sugerido:** `npm run dev` (web + API) · SQLite local ou banco de homologação.

**Credenciais demo (seed):**

| Perfil | E-mail / usuário | Senha |
|--------|------------------|-------|
| Gestor | gestor@ecopet.com.br | Ecopet@2026 |
| Tutor | tutor@ecopet.com.br | Ecopet@2026 |
| Bootstrap Master | gestorveras | AASSSVVV@1972 |

---

## 1. Infraestrutura

- [ ] `npm run build` conclui sem erro (monorepo)
- [ ] `npm run dev` sobe web (3000) e API (4000)
- [ ] `GET /health` retorna `{ status: "ok" }`
- [ ] Rodapé global visível em páginas públicas
- [ ] Logo ECOPET em login/cadastro

## 2. Tela inicial e navegação

- [ ] Home carrega sem tela branca
- [ ] Menu principal navega (marketplace, social, perfil, meu pet)
- [ ] Links do rodapé (termos, privacidade, contato) abrem
- [ ] Nenhum botão crítico leva a 404

## 3. Cadastro

- [ ] Cadastro tutor/cliente — CPF, e-mail, telefone, senha, termos
- [ ] Cadastro parceiro — CNPJ único
- [ ] Cadastro ONG/protetor
- [ ] Data de nascimento futura rejeitada
- [ ] ADMIN não aparece no cadastro público
- [ ] Duplicidade CPF/CNPJ/e-mail bloqueada com mensagem clara
- [ ] CEP preenche logradouro/bairro/cidade/UF
- [ ] Links termos e política abrem em nova aba

## 4. Login / logout / senha

- [ ] Login tutor com credenciais válidas
- [ ] Usuário inexistente: mensagem amigável
- [ ] Senha incorreta: "Usuário ou senha incorretos."
- [ ] Logout encerra sessão
- [ ] Recuperar senha — e-mail não cadastrado
- [ ] Recuperar senha — link enviado (dev: token no console)
- [ ] Redefinir senha — token válido
- [ ] Redefinir senha — token expirado/inválido
- [ ] Alteração de senha logado

## 5. Perfil do usuário

- [ ] Editar nome, telefone, bio
- [ ] Foto de perfil (URL/metadados)
- [ ] Endereço com CEP
- [ ] Visualização pública do perfil social
- [ ] Seguidores/seguindo (se aplicável)

## 6. Meus Pets

- [ ] Listar pets do tutor logado
- [ ] Cadastrar pet (espécie, raça, peso, sexo)
- [ ] Editar pet
- [ ] Prontuário / vacinas / medicações / peso
- [ ] Pet perdido / encontrado
- [ ] Página pública `/pet/[slug]`
- [ ] Empty state sem login ou sem pets

## 7. Marketplace (cliente)

- [ ] Listar produtos e serviços
- [ ] Busca e filtros
- [ ] Favoritos
- [ ] Carrinho — adicionar/remover
- [ ] Checkout — CEP, entrega, retirada
- [ ] Aviso de pagamento (homologação financeira)
- [ ] Saldo ECOPET (wallet)
- [ ] Orçamento personalizado (parcial/mock onde indicado)
- [ ] Chat/contato parceiro

## 8. Marketplace (parceiro)

- [ ] Painel parceiro acessível
- [ ] CRUD produto/serviço (ou mock documentado)
- [ ] Pedidos visíveis
- [ ] Avaliações

## 9. ONG / Protetor

- [ ] Perfil institucional
- [ ] Animais para adoção
- [ ] Campanhas (parcial se mock)
- [ ] Contatos e denúncias

## 10. Rede social

- [ ] Feed carrega
- [ ] Curtir/descurtir
- [ ] Comentar (se API conectada)
- [ ] Denunciar publicação
- [ ] Explorar / tendências (parcial se mock)
- [ ] Mensagens — envio básico
- [ ] Perfil autor `/social/perfil/[id]`

## 11. AgroPet (se perfil existir)

- [ ] Cadastro e perfil
- [ ] Produtos/serviços AgroPet
- [ ] Permissões corretas

## 12. Painel Gestor

- [ ] Dashboard gestor
- [ ] Aprovações / moderação
- [ ] Auditoria
- [ ] Robôs internos (`GET /api/gestor/internal-bots`)
- [ ] Ativar/desativar robô (gestor TI)
- [ ] Workflows / feature flags (visual)

## 13. Termos, política, institucional

- [ ] `/termos-de-uso`
- [ ] `/politica-de-privacidade`
- [ ] Redirects `/termos` e `/privacidade`

## 14. Responsividade

Testar em:

- [ ] Celular pequeno (320–375px)
- [ ] Celular grande (390–430px)
- [ ] Tablet (768px)
- [ ] Notebook (1024px)
- [ ] Desktop (1280px+)

Verificar: menu, formulários, cards, modais, tabelas, sidebar.

## 15. Acessibilidade (básico)

- [ ] Labels em campos principais de cadastro/login
- [ ] Foco visível em botões e inputs
- [ ] Contraste legível em textos principais
- [ ] Botões com texto ou aria-label
- [ ] Mensagens de erro legíveis (sem stack trace)

## 16. Erros previstos (não devem aparecer ao usuário)

- [ ] Sem "Failed to fetch" genérico
- [ ] Sem "Internal Server Error" cru
- [ ] Sem "undefined" / "null" na UI
- [ ] Sem erro Prisma exposto

## 17. Robôs internos

- [ ] 9 robôs listados no gestor
- [ ] Mensagem: "Automação estrutural disponível..."
- [ ] Log de ativação/desativação
- [ ] Cards de perfil não ficam com botões mortos

## 18. Build final pós-testes

- [ ] `npm run build` aprovado após correções
- [ ] Nenhuma rota crítica quebrada

---

**Registro de execução**

| Data | Testador | Ambiente | Resultado geral |
|------|----------|----------|-----------------|
| | | | |

**Observações:**
