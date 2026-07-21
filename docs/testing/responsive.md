# Responsividade — Enterprise QA

## Automatizado neste run

| Viewport | Página | Critério | Resultado |
|----------|--------|----------|-----------|
| 375×812 | `/` | Sem overflow horizontal (`scrollWidth ≤ clientWidth+2`) | ✅ visitor.spec |
| Desktop default Playwright | Suíte completa | Páginas abrem / CTAs / forms | ✅ 38 passed |

## Matriz Homolog (manual / BrowserStack)

| Largura | Prioridade | Landing | Login | Cadastro | Marketplace | Social | IA | Cliente | Partner | ONG | Admin |
|---------|------------|---------|-------|----------|-------------|--------|----|---------|---------|-----|-------|
| 320 | P1 | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual |
| 360 | P1 | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual |
| 375 | P0 | ✅ auto | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual |
| 390 | P1 | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual |
| 414 | P1 | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual |
| 768 | P1 | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual |
| 1024 | P1 | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual |
| 1280 | P0 | ✅ auto (desktop) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | gates |
| 1440 | P2 | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual |
| 1920 | P2 | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual | Manual |

## Cross-browser

| Browser | Status neste run |
|---------|------------------|
| Chrome (Playwright Chromium) | ✅ |
| Edge | ⚠ Homolog |
| Firefox | ⚠ Homolog |
| Safari / iOS | ⚠ Homolog |
| Android Chrome | ⚠ Homolog |

## Checklist visual Homolog

- [ ] Sem scroll horizontal em 320–414  
- [ ] Bottom nav / safe-area iOS  
- [ ] VLibras não cobre CTA primário  
- [ ] Tabelas Admin com scroll contido  
- [ ] Modais cabem em 375  
- [ ] Dark + Light em 375 e 1280  

## Achados

Nenhum overflow em 375 na landing. Demais breakpoints: **pendentes Homolog** (P1).
