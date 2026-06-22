# Relatório — Integração VLibras EcoPet

## Causa raiz

1. **Falso positivo de READY** — o sistema marcava sucesso após `new VLibras.Widget()` ou `widgetInstance !== null`, sem verificar `[vw-access-button] .vp-access-button` no DOM.
2. **Incompatibilidade SPA** — o plugin gov.br injeta o avatar no handler de `window.load`; no Next.js esse evento já ocorreu antes do script carregar sob demanda.
3. **Atalhos no loader** — `loadScriptOnce()` retornava sucesso quando `widgetInstance` existia, mesmo sem avatar renderizado.

## Correções realizadas

| # | Correção |
|---|----------|
| 1 | `window.dispatchEvent(new Event("load"))` imediatamente após `new VLibras.Widget()` |
| 2 | `isVLibrasAvatarVisible()` — seletor exclusivo `[vw-access-button] .vp-access-button` |
| 3 | `ensureAvatarInjected()` — poll 500ms, timeout 10s |
| 4 | Removidos atalhos `widgetInstance !== null` / script carregado como READY |
| 5 | READY só quando `isVLibrasAvatarVisible() === true` |
| 6 | Timeout → status `unavailable` + mensagem `vlibrasAvatarFailed` |
| 7 | CSS reforçado para `.vp-access-button` (display, visibility, opacity, pointer-events) |
| 8 | CSP já permite `vlibras.gov.br` e `www.vlibras.gov.br` |
| 9 | Logs `[VLIBRAS]` em desenvolvimento |

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `apps/web/src/lib/accessibility/vlibras-loader.ts` | Reescrito — pipeline script→widget→avatar, logs, sem falso positivo |
| `apps/web/src/lib/accessibility/constants.ts` | `VLIBRAS_AVATAR_POLL_MS`, `VLIBRAS_AVATAR_TIMEOUT_MS` |
| `apps/web/src/lib/accessibility/vlibras-load-outcome.ts` | `button-missing` → `unavailable` |
| `apps/web/src/lib/accessibility/vlibras-load-outcome.test.ts` | Teste avatar-missing |
| `apps/web/src/components/accessibility/VLibrasWidget.tsx` | READY dupla verificação (outcome + avatar DOM) |
| `apps/web/src/components/shared/accessibility/accessibility-toolbar.tsx` | Mensagem avatar + READY condicionado ao DOM |
| `apps/web/src/styles/accessibility.css` | Visibilidade `.vp-access-button` |
| `apps/web/i18n/locales/{pt-BR,en,es}.json` | Chave `a11y.vlibrasAvatarFailed` |
| `docs/integrations/vlibras.md` | Este relatório |

## Fluxo corrigido

```
Toggle ON → librasEnabled=true
  → ensureScriptLoaded()     [VLIBRAS] Script carregado
  → createWidgetInstance()   [VLIBRAS] Widget criado + load disparado
  → ensureAvatarInjected()   poll 500ms até .vp-access-button
  → READY somente se avatar no DOM
```

## Evidência de avatar renderizado

No DevTools → Elements, após READY:

```html
<div vw-access-button="">
  <div class="vp-access-button">...</div>
</div>
```

Console (dev): `[VLIBRAS] Avatar encontrado`

## Testes

```bash
npm run test:vlibras -w @ecopet/web
npm run type-check
npm run lint
npm run build
```

Checklist manual: primeiro load, navegação SPA, toggle múltiplo, refresh, mobile, dark mode.

## URLs oficiais

- Script: `https://vlibras.gov.br/app/vlibras-plugin.js`
- Fallback: `https://www.vlibras.gov.br/app/vlibras-plugin.js`
- Widget: `https://vlibras.gov.br/app`
