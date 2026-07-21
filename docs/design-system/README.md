# EcoPet Design System — Etapa 1 (UI Foundation)

Fundação visual premium do EcoPet: tokens, tipografia, marca, componentes-base, loading, motion e acessibilidade.

## Princípios

- **Verde forte** como cor de marca (não amarelo fraco)
- Wordmark **EcoPet** em `#FFFFFF` sobre fundos escuros/verdes
- Mobile first, contraste adequado, `prefers-reduced-motion`
- Apenas camada visual — sem mudança de regras de negócio

## Estrutura

| Área | Caminho |
|------|---------|
| Tokens CSS | `apps/web/src/styles/tokens.css` |
| Temas | `apps/web/src/styles/themes.css` |
| Motion | `apps/web/src/styles/motion.css` |
| Utilities | `apps/web/src/styles/utilities.css` |
| Globals | `apps/web/src/styles/globals.css` |
| TS tokens | `apps/web/src/lib/design-system/` |
| UI | `apps/web/src/components/ui/` |
| Brand | `apps/web/src/components/shared/brand/` |
| Skeletons | `apps/web/src/components/skeletons/` |
| Assets | `apps/web/public/brand/` |

## Documentação

- [colors.md](./colors.md)
- [typography.md](./typography.md)
- [brand.md](./brand.md)
- [components.md](./components.md)
- [icons.md](./icons.md)
- [motion.md](./motion.md)
- [loading.md](./loading.md)
- [responsiveness.md](./responsiveness.md)
- [accessibility.md](./accessibility.md)
- [migration-guide.md](./migration-guide.md)
- [etapa-1-report.md](./etapa-1-report.md)

## O que evitar

- Amarelo claro como CTA primário
- Branco acinzentado/cream no nome EcoPet em fundo escuro
- Gradientes em todos os elementos
- Emojis como ícones de UI
- Texto cru “Carregando...” em telas institucionais
- Alterar handlers, rotas, APIs ou schemas na Etapa 1
