# Acessibilidade

## Preservar

- VLibras e loader existente
- Painel de acessibilidade (`accessibility.css` + provider)
- i18n (pt-BR / en / es)
- Focus-visible, ARIA existentes, skip link

## Fundação

- Outline de foco via `--ep-ring`
- Contraste de botões primários (verde + branco)
- Wordmark `#FFFFFF` em fundo escuro
- `prefers-reduced-motion` em motion/skeletons
- Labels em IconButton / FormField

## Não fazer

- Remover outlines sem substituição
- Remover atributos ARIA
- Alterar lógica do seletor de tema ou do VLibras
