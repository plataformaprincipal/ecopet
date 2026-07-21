# Componentes-base

Local: `apps/web/src/components/ui/` e `components/layout/`.

## Inventário (Etapa 1)

| Componente | Notas |
|------------|-------|
| Button | primary, secondary, outline, ghost, destructive, success, link, dark; sizes sm/md/lg/icon; `loading` |
| IconButton | aria-label obrigatório |
| Input / Textarea / SearchInput | altura confortável, foco verde |
| Select / Checkbox / Radio / Switch / Label | base Radix ou nativo |
| FormField / FormMessage | apresentação; não altera schema |
| Card / Surface | surfaces: base, elevated, interactive, highlighted, glass, dark |
| Badge / Chip / Alert / Progress | semânticos |
| Tabs / Dialog | APIs existentes preservadas |
| Avatar / EmptyState / Spinner / Skeleton | feedback |
| PageHeader / SectionHeader / TableShell | layout |
| Logo / BrandMark / InstitutionalLoader | marca |

## Regras

- Aceitar `className`
- Preservar props/handlers existentes
- Focus-visible obrigatório
- Disabled / loading claros
- Migrar telas na Etapa 2; nesta etapa herdam tokens globais
