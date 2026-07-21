# Responsividade

## Abordagem

Mobile first. Tokens de container: `--ep-container-*`, `--ep-gutter`, `--ep-touch-min` (44px).

## Breakpoints de validação

320 · 360 · 375 · 390 · 414 · 768 · 1024 · 1280 · 1440 · 1920

## Regras

- Área de toque ≥ 44px em ações principais
- Tipografia com `clamp` nos headings
- Tabelas em `TableShell` com scroll horizontal contido
- Evitar overflow horizontal global
- Sidebar escura/branca herda tokens; arquitetura de navegação **não** muda na Etapa 1
- Safe areas: `env(safe-area-inset-*)` no container
