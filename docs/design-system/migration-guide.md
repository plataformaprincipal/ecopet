# Guia de migração (Etapa 1 → 2)

## Já herdado automaticamente

- Tokens CSS / Tailwind `@theme`
- Tipografia global
- Button / Input / Card / Dialog base
- Logo / loading institucional
- Header / sidebar / footer (visual)

## Ao redesenhar módulos (Etapa 2)

1. Preferir classes utilitárias e tokens (`ecopet-green`, `ep-*`, surfaces)
2. Substituir amarelo de marca por verde ou accent gold só quando rating/warning
3. Usar skeletons tipados em vez de texto “Carregando...”
4. Ícones lucide com `strokeWidth={2}` e tamanhos padrão
5. Não alterar `onClick` / rotas / schemas / APIs
6. Wordmark em fundo escuro: `text-white` (`#FFFFFF`)

## Classes legadas

| Antes | Depois |
|-------|--------|
| `bg-ecopet-yellow` em CTA | `bg-ecopet-green` + `text-white` |
| cream no wordmark | `text-white` |
| `shadow-premium` ad-hoc | tokens `--shadow-*` |
| spinners genéricos | `InstitutionalLoader` / `Skeleton*` |
