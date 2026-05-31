# Checklist técnico — Acessibilidade e i18n ECOPET

Entrega das seções 16–17 do módulo de acessibilidade e internacionalização.

---

## §17 — Componentes e integração

| Item | Status | Local |
|------|--------|-------|
| `AccessibilityToolbar` (flutuante, minimizável) | ✅ | `components/accessibility/accessibility-toolbar.tsx` |
| Painel completo (9 seções) | ✅ | Visual, Auditiva, Cognitiva, Motora, Neuro, Libras, Braille, Idiomas, Preferências |
| Estilos globais a11y | ✅ | `app/accessibility.css` (import em `globals.css`) |
| Classes utilitárias CSS | ✅ | `.a11y-high-contrast`, `.a11y-dyslexia`, `.a11y-calm`, `.a11y-motor`, etc. |
| Persistência local | ✅ | Zustand persist `ecopet-a11y-v2` |
| Sync servidor (logado) | ✅ | `hooks/use-preferences-sync.ts` → `PATCH /api/users/me/preferences` |
| Integração layout global | ✅ | `app/layout.tsx` — providers + `AccessibilityToolbarLazy` |
| Skip link | ✅ | `components/accessibility/skip-link.tsx` → `#main-content` |
| Aria live | ✅ | `components/accessibility/aria-live-region.tsx` |
| Reading assist | ✅ | `components/accessibility/reading-assist.tsx` |

---

## Modos de acessibilidade

| Modo | Status | Detalhe |
|------|--------|---------|
| Dislexia | ✅ | Fonte OpenDyslexic, espaçamento, `dyslexiaMode` |
| Calmo / autismo | ✅ | `calmMode` — cores suaves, animações reduzidas |
| Motricidade reduzida | ✅ | `motorMode` — alvos grandes, cursor ampliado |
| Leitor de tela / Braille | ✅ | `screenReaderMode`, foco forte, HTML semântico, skip link |
| Libras (VLibras) | ✅ | Estrutura + widget sob demanda (`vlibras-widget.tsx`) |
| Contraste / escala / cognitivo | ✅ | highContrast, grayscale, simplifiedUI, cognitiveMode, etc. |

---

## i18n e tradução

| Item | Status | Local |
|------|--------|-------|
| Estrutura i18n tipada | ✅ | `lib/i18n/` |
| 11 locales configurados | ✅ | `lib/i18n/config.ts` |
| Bundles estáticos pt-BR, en, es | ✅ | `lib/i18n/messages/` |
| Auto-tradução API (8 idiomas) | ✅ | fr, it, de, ja, zh, ko, ar, hi |
| TranslationService server-side | ✅ | `apps/api/src/services/translation-service.ts` |
| Rotas API | ✅ | `POST /api/translate/text`, `/batch`, `/detect` |
| Detecção idioma navegador | ✅ | `detectBrowserLocale()` |
| RTL (árabe) | ✅ | `html[dir=rtl]` |
| Seletor de idioma | ✅ | Toolbar + header |
| Provider React | ✅ | `providers/i18n-provider.tsx` |

---

## §16 — Segurança e performance

| Regra | Status | Implementação |
|-------|--------|---------------|
| Sem scripts externos inseguros | ✅ | VLibras: domínio oficial validado, `crossOrigin`, `referrerPolicy` |
| Sem libs pesadas desnecessárias | ✅ | Toolbar via `next/dynamic` |
| Chaves API não expostas | ✅ | Apenas variáveis de ambiente no backend |
| SEO não prejudicado | ✅ | SSR conteúdo principal; `lang` dinâmico |
| Responsividade preservada | ✅ | CSS responsivo; toolbar minimizável |
| Carregamento inicial leve | ✅ | Sem prefetch batch completo no bootstrap |
| Lazy loading | ✅ | Toolbar, VLibras, prefetch idle |
| Tradução automática controlada | ✅ | Max 2 prefetches/sessão; ~20 chaves prioritárias; rate limit 30/min |
| Fallback seguro | ✅ | Cadeia estática + retorno texto original se API falhar |

---

## Migração incremental (pendente / contínuo)

| Item | Status |
|------|--------|
| Todas as páginas com `t("key")` | 🔄 Parcial (nav, auth, toolbar, skip link) |
| Landing, feed, marketplace strings | 🔄 Hardcoded PT — migrar gradualmente |

---

## Documentação

| Documento | Local |
|-----------|-------|
| Guia consolidado (idiomas + a11y) | `docs/ACCESSIBILITY_I18N.md` |
| README i18n | `apps/web/src/lib/i18n/README.md` |
| README a11y | `apps/web/src/lib/accessibility/README.md` |
| Este checklist | `docs/TECHNICAL_CHECKLIST.md` |

---

## Variáveis de ambiente (tradução)

```env
# apps/api — nunca NEXT_PUBLIC_
OPENAI_API_KEY=
DEEPL_API_KEY=
GOOGLE_TRANSLATE_API_KEY=
```

---

## Como validar localmente

```powershell
cd C:\Users\Valnia\Projects\ecopet
npm run dev
```

1. Abrir app → botão acessibilidade (canto inferior).
2. Testar modos dislexia, calmo, motor.
3. Trocar idioma (pt, en, es instantâneos; outros com fallback + prefetch idle).
4. Ativar Libras → widget VLibras carrega sob demanda.
5. Recarregar → preferências persistidas.
6. Login → preferências sincronizadas com backend.

---

*Última atualização: entrega seções 16–17 — otimizações de performance e documentação.*
