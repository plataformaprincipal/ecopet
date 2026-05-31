# Módulo de Acessibilidade ECOPET

Toolbar global em todas as páginas via `layout.tsx` (carregamento lazy).

## Componentes

| Arquivo | Função |
|---------|--------|
| `accessibility-toolbar.tsx` | Barra flutuante minimizável (9 seções) |
| `skip-link.tsx` | Skip link para `#main-content` |
| `aria-live-region.tsx` | Anúncios para leitor de tela |
| `reading-assist.tsx` | Máscara e guia de leitura |
| `vlibras-widget.tsx` | VLibras (gov.br) sob demanda |

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

Ativar **Libras** carrega script oficial de `vlibras.gov.br` (validado). Requer internet. Fallback amigável se indisponível.

## Segurança

- Scripts externos: apenas domínio oficial VLibras
- Toolbar lazy-loaded (`next/dynamic`) para não impactar LCP
- Preferências nunca expõem credenciais

## Extensão

Ver [`docs/ACCESSIBILITY_I18N.md`](../../../../docs/ACCESSIBILITY_I18N.md) — seção "Como adicionar um novo recurso de acessibilidade".
