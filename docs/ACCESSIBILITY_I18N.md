# Acessibilidade e i18n — ECOPET

Guia consolidado do módulo de acessibilidade e internacionalização do app web.

## Estrutura de arquivos

```
apps/web/src/
├── app/
│   ├── layout.tsx              # Integração global (toolbar lazy, providers)
│   └── accessibility.css       # Modos visuais e utilitários a11y
├── components/accessibility/
│   ├── accessibility-toolbar.tsx
│   ├── skip-link.tsx
│   ├── aria-live-region.tsx
│   ├── reading-assist.tsx
│   └── vlibras-widget.tsx
├── providers/
│   ├── accessibility-provider.tsx
│   └── i18n-provider.tsx
├── store/accessibility-store.ts
├── lib/accessibility/
│   ├── types.ts
│   └── constants.ts
└── lib/i18n/
    ├── config.ts
    ├── bootstrap.ts            # Bootstrap leve (sem batch completo)
    ├── constants.ts            # Chaves prioritárias de tradução
    ├── resolver.ts
    ├── translation-client.ts
    └── messages/               # pt-BR, en, es

apps/api/src/
├── routes/translation.ts
└── services/translation-service.ts
```

---

## Como adicionar um novo idioma

### 1. Bundle estático (recomendado para idiomas principais)

1. Em `lib/i18n/config.ts`, adicione o código em `LOCALES` e, se necessário, em `STATIC_LOCALES`.
2. Crie `lib/i18n/messages/<codigo>.ts` copiando a estrutura de `pt-BR.ts`.
3. Registre o bundle em `lib/i18n/resolver.ts` (`staticBundles`).
4. Adicione rótulo em `components/i18n/language-selector.tsx` (se existir mapa local).

Exemplo: para alemão com bundle estático, inclua `"de"` em `STATIC_LOCALES` e crie `messages/de.ts`.

### 2. Auto-tradução via API (idiomas secundários)

1. Adicione o locale em `LOCALES` em `config.ts` (não em `STATIC_LOCALES`).
2. O resolver usa cadeia de fallback: locale → en → pt-BR.
3. Prefetch automático cobre apenas ~20 chaves prioritárias (`lib/i18n/constants.ts`), em idle.
4. Demais textos permanecem no fallback até tradução sob demanda ou migração para bundle estático.

### 3. RTL (árabe, hebraico, etc.)

Em `config.ts`, marque o locale em `RTL_LOCALES`. O `html[dir]` é atualizado automaticamente.

### 4. Chaves de tradução

1. Adicione a chave tipada em `lib/i18n/types.ts` (`TranslationKey`).
2. Inclua o texto em `messages/pt-BR.ts` (fonte canônica).
3. Replique em `en.ts` e `es.ts` (ou deixe fallback).
4. Use `const { t } = useTranslation();` → `t("sua.chave")`.

---

## Como adicionar um novo recurso de acessibilidade

### 1. Preferência no store

1. Adicione campo booleano/numérico em `lib/accessibility/types.ts` (`AccessibilityPreferences`).
2. Inclua valor padrão em `DEFAULT_PREFERENCES`.
3. Se for toggle, use `toggle("nomeDoCampo")` do store.

### 2. Estilos globais

1. Em `app/accessibility.css`, crie classe utilitária (ex.: `.a11y-meu-modo`).
2. Em `providers/accessibility-provider.tsx`, aplique a classe no `<html>` ou `<body>` quando a preferência estiver ativa.

### 3. UI na toolbar

1. Abra `components/accessibility/accessibility-toolbar.tsx`.
2. Adicione controle na seção adequada (Visual, Cognitiva, Motora, Neuro, etc.).
3. Adicione chaves i18n em `messages/pt-BR.ts` sob `a11y.*`.

### 4. Persistência

- Visitante: automático via Zustand persist (`ecopet-a11y-v2`).
- Logado: `PreferencesSync` envia para `PATCH /api/users/me/preferences` (debounce 1,5 s).

### 5. Integrações externas (ex.: Libras)

- Carregar **somente sob demanda** (toggle do usuário).
- Validar URL (`https` + domínio oficial).
- Exibir fallback amigável em caso de erro de rede.
- Referência: `vlibras-widget.tsx`.

---

## Segurança e performance (regras §16)

| Regra | Implementação |
|-------|----------------|
| Sem scripts externos inseguros | VLibras apenas de `vlibras.gov.br`, validado em runtime |
| Sem bibliotecas pesadas desnecessárias | Toolbar com `next/dynamic` (`ssr: false`) |
| Chaves de API no servidor | `OPENAI_API_KEY`, `DEEPL_API_KEY`, `GOOGLE_TRANSLATE_API_KEY` só em `apps/api` |
| SEO preservado | `html lang`, metadados Next.js, conteúdo principal em SSR |
| Responsividade | Modos via CSS; toolbar flutuante e minimizável |
| Carregamento inicial | Sem batch de tradução no load; prefetch idle limitado |
| Lazy loading | Toolbar, VLibras, tradução batch sob demanda |
| Tradução automática controlada | Max 2 prefetches/sessão; ~20 chaves prioritárias; rate limit API 30/min |
| Fallback seguro | Cadeia pt-BR → en → chave original; API falha retorna texto fonte |

---

## Uso rápido

```tsx
// Tradução
const { t, locale, setLocale } = useTranslation();

// Preferências a11y
const dyslexiaMode = useAccessibilityStore((s) => s.dyslexiaMode);
const toggle = useAccessibilityStore((s) => s.toggle);
toggle("calmMode");
```

---

## Referências

- [Checklist técnico completo](./TECHNICAL_CHECKLIST.md)
- [README i18n](../apps/web/src/lib/i18n/README.md)
- [README a11y](../apps/web/src/lib/accessibility/README.md)
