# Bugs & Achados — Enterprise QA

Classificação: **P0** bloqueia go-live · **P1** bloqueia Homolog completa · **P2** deveria corrigir antes de prod · **P3** polish

| ID | Módulo | Problema | Prioridade | Status | Correção | Arquivo / Evidência | Impacto |
|----|--------|----------|------------|--------|----------|---------------------|---------|
| B-001 | Landing | Imagem Unsplash do módulo IA retorna 404 | P2 | **Corrigido neste QA** | URL substituída | `premium-public-home.tsx` / webServer log | Visual quebrado no card IA |
| B-002 | E-mail | SMTP Gmail `535 BadCredentials` em todo cadastro E2E | P2 | Aberto (ops) | App Password / Mailpit / Resend | logs `[mail:sendMail]` | E-mail transacional falha; cadastro API OK |
| B-003 | TalkJS | `TALKJS_APP_ID` ausente no env local | P1 | Aberto (config) | Preencher env Homolog | `qa-env-audit.mjs` | Inbox real não validável |
| B-004 | Firebase | `NEXT_PUBLIC_FIREBASE_*` incompleto | P1 | Aberto (config) | Completar web config | env audit | Push browser limitado |
| B-005 | Pagamentos | `PAYMENT_PROVIDER=none` | P0* | Esperado local | Homolog com MP test/Live | env audit | Checkout real impossível |
| B-006 | Observabilidade | Better Stack token ausente | P1 | Aberto (config) | Token + host Homolog | env audit | Live-tail não comprovado |
| B-007 | AI | `AI_ENABLED=false` | P2 | Esperado local | Ligar em Homolog | env audit | Chat IA só shell/demo |
| B-008 | QA HTTP | `test:register` / `test:security` falham sem servidor dedicado | P3 | Processo | Usar `test:server:start` ou E2E | scripts | Cobertura HTTP paralela |
| B-009 | Cross-browser | Playwright só Chromium | P1 | Gap | Projetos FF/WebKit Homolog | `playwright.config.ts` | Risco Safari/iOS |
| B-010 | Admin interno | SUPER_ADMIN E2E não executado | P1 | Gap | Credenciais seguras Homolog | admin-gates skip | Painel TI sem prova E2E |
| B-011 | Perf | Lighthouse/CLS/LCP/INP não medidos neste run | P2 | Gap | CI Homolog | — | Sem baseline numérico |
| B-012 | Noise | Muitos `login_failed` USER_NOT_FOUND durante E2E partner pós-logout | P3 | Observação | Retry helper / rate limit | webServer logs | Ruído observabilidade |

\*P0 para produção; não impede iniciar Homolog.

## Regressões UI Etapa 2

Nenhuma regressão funcional detectada nos 38 E2E. Único defeito visual confirmado: B-001 (corrigido).

## Não-bugs (comportamento esperado)

- Turnstile pode desabilitar submit UI em alguns ambientes — unit coberta; UI login passou neste run.  
- Health público sem vazamento de host/Prisma (hardening prévio).  
- Mensagens de login genéricas (anti-enumeração) — validado.
