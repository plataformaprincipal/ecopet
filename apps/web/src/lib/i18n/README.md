# ECOPET i18n

## Arquitetura

```
lib/i18n/
├── config.ts              # Locales, RTL, detecção navegador
├── types.ts               # TranslationKey (tipado)
├── constants.ts           # Chaves prioritárias, limite prefetch
├── bootstrap.ts           # Bootstrap leve (sem batch completo)
├── resolver.ts            # Bundles estáticos + cache dinâmico
├── translation-client.ts  # Chamadas à API /api/translate
├── index.ts               # createTranslator, re-exports
└── messages/
    ├── pt-BR.ts           # Bundle completo (padrão)
    ├── en.ts
    └── es.ts
```

## Idiomas

| Código | Bundle estático | Auto-tradução API |
|--------|-----------------|-------------------|
| pt-BR  | ✅              | —                 |
| en, es | ✅              | —                 |
| fr, it, de, ja, zh, ko, ar, hi | — | ✅ (cache) |

## Uso

```tsx
const { t, locale, setLocale } = useTranslation();
t("nav.home");
```

## Performance e segurança

- **Sem batch completo no load** — `bootstrapLocale()` aplica `lang`/`dir` de forma síncrona.
- **Prefetch idle** — apenas chaves em `PRIORITY_TRANSLATION_KEYS` (~20), max 2× por sessão.
- **Fallback** — locale → en → pt-BR → chave original; falha de API retorna texto fonte.
- **Chaves de API** — somente no backend (`apps/api`); frontend usa `NEXT_PUBLIC_API_URL`.

## API (backend)

- `POST /api/translate/text` — traduz texto (max 5000 chars)
- `POST /api/translate/batch` — lote (max 50 chaves)
- `POST /api/translate/detect` — detecta idioma

Provedores (env): DeepL > OpenAI > Google > fallback original.

## Persistência

- Visitante: `localStorage` (Zustand `ecopet-a11y-v2` + cache `ecopet-i18n-dynamic-cache`)
- Logado: `User.preferences.a11y` via `PATCH /api/users/me/preferences`

## Adicionar idioma

Ver guia completo: [`docs/ACCESSIBILITY_I18N.md`](../../../../docs/ACCESSIBILITY_I18N.md)
