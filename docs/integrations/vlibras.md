# Relatório — Integração VLibras EcoPet (correção definitiva)

## Causa raiz (Unity travado na barra de progresso)

### Problema principal (2026-07)

O loader EcoPet chamava `dispatchSpaLoadEvent()` em loop (poll a cada 500ms) e em toda navegação SPA. Isso reexecutava o `window.onload` registrado pelo plugin oficial gov.br.

No código oficial (`vlibras-plugin.js`, módulo 9927), cada `window.onload` chama `m.load([vw-plugin-wrapper])`, que faz **`innerHTML = ...`** no wrapper — **apagando o `#gameContainer` e o canvas Unity enquanto os assets `.unityweb` ainda carregavam**.

**Sintoma:** popup abre, logo Unity, barra de progresso trava, avatar nunca aparece.

### Recursos Unity (Network)

| Ordem | URL | Status | Notas |
|-------|-----|--------|-------|
| 1º | `https://vlibras.gov.br/app/vlibras-plugin.js` | 302→200 | Redirect para jsdelivr (oficial) |
| 2º | `.../vlibras-plugin.chunk.js` | 200 | Plugin UI |
| 3º (clique) | `.../target/UnityLoader.js` | 302→200 | Loader Unity legado |
| 4º | `.../target/playerweb.json` | 200 | Manifest Unity |
| 5º | `.../target/playerweb.data.unityweb` | 200 | ~10MB |
| 6º | `.../target/playerweb.wasm.code.unityweb` | 200 | ~3MB WASM |

**Request que falhava:** não era HTTP — era **destruição do DOM** antes do WASM terminar. Secundário: CSP sem `'wasm-unsafe-eval'` (Chrome bloqueia compilação WASM).

### Correções aplicadas

1. **`fireOfficialLoadOnce()`** — `window.onload` oficial dispara **uma única vez** após `new VLibras.Widget()`.
2. **Removido** poll `ensureAvatarInjected` com re-onload.
3. **`notifyVLibrasRouteChange`** — só `vp-enable-text-capture`; **não** re-onload.
4. **`rootPath` oficial** — `https://vlibras.gov.br/app/` (barra final).
5. **CSP** — `'wasm-unsafe-eval'` + `media-src` + jsdelivr (redirect oficial).
6. **CSS** — `#gameContainer canvas` visível; toolbar z-index abaixo do VLibras.
7. **Toolbar** — fecha ao ativar Libras (não cobre avatar).


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
