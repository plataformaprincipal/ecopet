# Tipografia

## Fontes (`next/font`)

- **Sans:** Inter (`--font-inter`)
- **Display:** Plus Jakarta Sans (`--font-jakarta`)

Não adicionar fontes extras sem necessidade.

## Escala

| Classe | Uso |
|--------|-----|
| `.text-display` | Hero / marca |
| `.heading-1` / `h1` | Título de página |
| `.heading-2` / `h2` | Seções |
| `.heading-3` / `h3` | Subseções |
| `.heading-4` / `h4` | Cards |
| `.body-large` | Introduções |
| `.body-text` | Corpo |
| `.body-small` | Secundário |
| `.label-text` | Labels |
| `.caption-text` | Metadados |
| `.overline-text` | Overlines |
| `.button-text` | Botões |

Títulos usam `clamp()` para mobile ≥ 320px. Evitar `font-extrabold` em excesso — preferir `bold`/`semibold`.
