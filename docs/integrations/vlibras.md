# Relatório — Integração VLibras EcoPet (correção definitiva)

## Causa raiz

### Problema principal (avatar não aparecia)

O `VLibrasWidget` renderizava um **`<div />` vazio** via `createPortal` e montava o DOM oficial **imperativamente** com `root.replaceChildren()` no `useEffect`.

No React, cada re-render reconcilia o virtual DOM com o real. Como o JSX declarava um container **sem filhos**, o React **removia** `[vw-access-button]`, `[vw-plugin-wrapper]` e `.vp-access-button` injetados pelo plugin — inclusive após `new VLibras.Widget()`.

**Sintoma:** alavanca acionada, script carregado, widget instanciado, mas botão/avatar sumiam ou nunca persistiam.

### Problemas secundários

| # | Problema | Impacto |
|---|----------|---------|
| 1 | `display: none` no estado oculto | Podia impedir reexibição estável do avatar |
| 2 | `retryVLibrasLoad()` removia o `<script>` | Reinjeção desnecessária e race conditions |
| 3 | SPA Next.js | `window.load` já disparado antes do script — mitigado com `dispatchEvent('load')` após init e em mudanças de rota |
| 4 | CSP | Já liberava `vlibras.gov.br` — **não era bloqueio** |

---

## Correções aplicadas

1. **DOM oficial no JSX** — estrutura idêntica à documentação VLibras 6.0, gerenciada pelo React (não mais `replaceChildren`).
2. **Script único** — flag `scriptInjected`; sem remover tag após sucesso.
3. **Widget único** — `widgetInstance` reutilizada; log `Widget já existente`.
4. **Alavanca OFF** — `visibility/opacity/pointer-events` (sem `display:none`); script, DOM e instância preservados.
5. **Retry soft** — `resetVLibrasWidget()` destrói só a instância, mantém script + DOM.
6. **Navegação SPA** — `notifyVLibrasRouteChange()` em `usePathname`.
7. **Logs diagnósticos** — `console.info` / `console.warn` / `console.error` prefixo `[VLIBRAS]`.
8. **CSS** — `position: fixed`, `z-index: 2147483646/7`, overflow visible.

---

## DOM oficial (presente no JSX)

```html
<div vw class="enabled" id="ecopet-vlibras-root">
  <div vw-access-button class="active"></div>
  <div vw-plugin-wrapper>
    <div class="vw-plugin-top-wrapper"></div>
  </div>
</div>
```

Script: `https://vlibras.gov.br/app/vlibras-plugin.js`  
Init: `new window.VLibras.Widget('https://vlibras.gov.br/app')`

---

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `components/accessibility/VLibrasWidget.tsx` | DOM declarativo; portal; SPA route hook |
| `lib/accessibility/vlibras-loader.ts` | Script/widget singleton; logs; soft reset; `notifyVLibrasRouteChange` |
| `styles/accessibility.css` | fixed + z-index; ocultar sem display:none |
| `types/vlibras.d.ts` | Tipos TS para atributos `vw*` |
| `app/layout.tsx` | `Suspense` em torno do widget |
| `docs/integrations/vlibras.md` | Este relatório |

**Sem alteração necessária:** `headers.ts` (CSP já compatível), `middleware.ts`.

---

## Evidências (build / testes)

```
✔ npm run lint
✔ npm run type-check
✔ npm run test:vlibras — 6/6 pass
✔ npm run build — OK
```

Logs esperados no console (dev):

```
[VLIBRAS] Pipeline iniciado
[VLIBRAS] Script carregado https://vlibras.gov.br/app/vlibras-plugin.js
[VLIBRAS] Widget criado https://vlibras.gov.br/app
[VLIBRAS] Avatar encontrado
[VLIBRAS] Widget pronto — avatar no DOM
```

---

## Checklist manual (Etapa 10)

| # | Passo | Como validar |
|---|-------|--------------|
| 1 | Abrir EcoPet | `npm run dev` |
| 2 | Acionar alavanca Libras | Toolbar a11y → Ativar Libras |
| 3 | Botão oficial aparece | `[vw-access-button] .vp-access-button` no DevTools |
| 4 | Clicar no botão | Painel VLibras abre |
| 5 | Avatar traduz | Selecionar texto na página |
| 6 | Trocar rota | Avatar continua visível |
| 7 | Refresh | Widget recarrega (script cacheado) |
| 8 | Mobile | Botão não fica atrás da FAB EcoPet |

---

## Status

**✅ Correção aplicada** — causa raiz identificada e corrigida (reconciliação React vs DOM imperativo).

Validação visual do avatar depende de rede até `vlibras.gov.br` (serviço externo gov.br). Se o gov.br estiver offline, status `unavailable` é esperado — não é bug do EcoPet.
