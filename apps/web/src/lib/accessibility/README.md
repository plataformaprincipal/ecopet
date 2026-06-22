# Módulo de Acessibilidade ECOPET

Toolbar global em todas as páginas via `layout.tsx` (carregamento lazy).

## Componentes

| Arquivo | Função |
|---------|--------|
| `accessibility-toolbar.tsx` | Barra flutuante minimizável (9 seções) |
| `skip-link.tsx` | Skip link para `#main-content` |
| `aria-live-region.tsx` | Anúncios para leitor de tela |
| `reading-assist.tsx` | Máscara e guia de leitura |
| `components/accessibility/VLibrasWidget.tsx` | VLibras global (gov.br) — todas as rotas |

## Modos implementados

- **Visual:** contraste, escala, espaçamento, grayscale, daltonismo
- **Dislexia:** fonte OpenDyslexic, espaçamento ampliado
- **Calmo/autismo:** paleta suave, animações reduzidas
- **Motricidade:** alvos grandes, cursor ampliado
- **Cognitivo:** UI simplificada
- **Leitor de tela / Braille:** foco reforçado, semântica HTML

## Persistência

- Visitante: `localStorage` (`ecopet-a11y-v2`)
- Logado: sync com `User.preferences.a11y`

## Libras

Widget global em `layout.tsx`. Script oficial de `vlibras.gov.br` (validado). Padrão ativo; toggle no painel EcoPet oculta/exibe. Ver [`docs/integrations/vlibras.md`](../../../../docs/integrations/vlibras.md).

## Segurança

- Scripts externos: apenas domínio oficial VLibras
- Toolbar lazy-loaded (`next/dynamic`) para não impactar LCP
- Preferências nunca expõem credenciais

## Extensão

Ver [`docs/ACCESSIBILITY_I18N.md`](../../../../docs/ACCESSIBILITY_I18N.md) — seção "Como adicionar um novo recurso de acessibilidade".
