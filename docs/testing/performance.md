# Performance — Enterprise QA

**Ambiente:** local `next dev` (não representa produção otimizada)  
**Medição quantitativa Lighthouse:** **não executada** neste run (gap P2)

## O que foi observado

| Métrica / Aspecto | Resultado | Notas |
|-------------------|-----------|-------|
| CLS | Não medido (Lighthouse) | Landing usa `next/image` + skeletons Foundation |
| LCP | Não medido | Hero Unsplash + logo SVG; risco LCP em 3G |
| INP | Não medido | Microinterações CSS/Framer leves na Foundation |
| TTFB | Não medido | Dev server ≠ prod |
| Bundle | Build Etapa 2 passou | Sem nova lib pesada na Etapa 2 |
| Hydration | Sem erro E2E | Páginas públicas/auth abriram |
| N+1 / Queries | Não profileado DB | E2E pet/list/cart sem timeout anormal |
| Imagens | 1× 404 Unsplash (corrigido) | Evita request retry/ruído |

## Evidências indiretas

- E2E acceptance **38/38** (exc. 1 skip) em ~5.1 min com 1 worker — sem timeouts sistemáticos de página.  
- Login API ~2s (bcrypt) — esperado.  
- Build web Etapa 2: exit 0 com `NODE_OPTIONS=8192`.

## Riscos

1. Hero full-bleed + múltiplas imagens Unsplash na landing → LCP Homolog.  
2. Social hub + TalkJS (quando ligado) → JS client.  
3. Admin dashboards com tabelas grandes → virtualização futura (Etapa 3).

## Ações Homolog (não feitas agora)

1. Lighthouse CI em Preview (mobile/desktop) nas rotas `/`, `/marketplace`, `/login`, `/cliente`, `/eccopet`.  
2. Capturar CLS/LCP/INP e anexar ao PR.  
3. Avaliar `next/image` sizes e blur placeholders nos módulos.  
4. Desligar AI/analytics em smoke se distorcer métricas.
