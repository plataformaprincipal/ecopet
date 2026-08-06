# Fase 2.2 — Homologação Externa em Preview — Resultado

**Branch:** `chore/fase-2-2-preview-homologacao`  
**Data:** 2026-08-06  
**Commit:** não criado (working tree ainda contém Fase 2/2.1 não commitadas)

---

## 1. Resumo executivo

A Fase 2.2 foi **iniciada** (branch, login Vercel, link ao projeto `ecopet-web`, docs de config/rollback, correção de URL Preview), mas **não concluída**: o deploy Preview falhou por Root Directory inconsistente (`apps/web/apps/web`), o working tree da Fase 2/2.1 ainda não está commitado, e passos que exigem material de credenciais / deploy remoto ficaram dependentes de aprovação explícita e isolamento de banco/MP.

## 2. Commit e branch

| Item | Estado |
| ---- | ------ |
| Branch base | `feat/fase-2-fluxo-comercial-minimo` @ `b1405fc` |
| Branch Fase 2.2 | `chore/fase-2-2-preview-homologacao` (criada) |
| Working tree | **Sujo** — alterações Fase 2 + 2.1 + 2.2 não commitadas |
| `tsconfig.tsbuildinfo` | Restaurado / não deve versionar |
| Secrets no Git | Não versionados; `.vercel` / `.env.local` locais |

**Pré-requisito da especificação (“tree limpo / fases commitadas”) não atendido.** Não houve commit silencioso.

## 3. Configuração Vercel

Ver `docs/VERCEL_DEPLOYMENT_CONFIGURATION.md`.

| Campo | Valor pretendido (Opção B) |
| ----- | -------------------------- |
| Projeto | `ecopet-s-projects/ecopet-web` |
| Produção | `https://www.eccopet.com` (**não** alterar) |
| Root Directory | `apps/web` |
| Install / Build | `cd ../.. && npm ci` / `cd ../.. && npm run build` |
| Node | 24.x |
| Link CLI | OK (`plataformaprincipal`) |

### Erro de deploy observado

```text
Error: The provided path “~\Documents\ecopet_github\apps\web\apps\web” does not exist.
```

**Causa:** Root Directory do projeto já é `apps/web`; ao linkar/deployar de dentro de `apps/web`, o caminho ficou duplicado.  
**Correção necessária:** deploy a partir da **raiz do monorepo**, ou ajustar Root Directory no painel para `.` se o cwd for `apps/web`.

## 4. Variáveis de Preview

Listagem de **nomes** (valores Hidden — não impressos):

Presentes em Preview (+ Production na maioria): `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_*`, `APP_URL`, `NEXT_PUBLIC_APP_URL`, `WEB_URL`, `PAYMENT_PROVIDER`, `MERCADO_PAGO_*`, Cloudinary, e-mail, etc.

| Regra | Status |
| ----- | ------ |
| `ALLOW_SIMULATED_PAYMENTS` | **Ausente** na lista (adequado) |
| Secrets sem `NEXT_PUBLIC_` | OK nos nomes MP privados |
| URL Preview vs Production | `APP_URL` / `NEXTAUTH_URL` / `WEB_URL` compartilhados Preview+Production — risco de cookies no host errado |
| Código | `resolvePublicAppUrl()` atualizado para preferir `VERCEL_URL` quando `VERCEL_ENV=preview` |

Pull sanitizado de valores (**prefixo MP TEST?**) **não concluído** — comando bloqueado por aprovação de material sensível.

## 5. Banco de homologação

| Achado | Impacto |
| ------ | ------- |
| `DATABASE_URL` / `DIRECT_URL` existem em **Preview e Production** | Alto risco de Preview apontar para o **mesmo** banco de produção |
| Migration Fase 2 | Aplicada no DB usado localmente (28); produção remota **não** revalidada nesta fase |
| Isolamento | **Não comprovado** |

## 6. Deploy

| Tentativa | Resultado |
| --------- | --------- |
| `vercel deploy --target=preview` a partir de `apps/web` (projeto `ecopet-web`) | **Falha** — path `apps/web/apps/web` |
| `vercel deploy` a partir da raiz | Criou projeto **novo** `ecopet_github` (não usar como canônico); build Next **compilou**, mas falhou no empacotamento: `No Output Directory named "public"` (framework não detectado / settings genéricos) |
| Inspect | `https://vercel.com/ecopet-s-projects/ecopet_github/A6z7nbT8ZYXrNtPiyvba1KhEo93b` |
| Deploy em `www.eccopet.com` / Production do `ecopet-web` | **Não executado** |
| URL Preview utilizável | **Não gerada** |

**Ação recomendada:** corrigir Root Directory / Framework do projeto **`ecopet-web`** (não o `ecopet_github` acidental) e redeploy Preview; remover ou arquivar `ecopet_github` se não for desejado.

## 7–18. Smoke / E2E / MP / Webhook / etc.

**Não executados** — dependem de Preview publicado + credenciais sandbox confirmadas + banco isolado.

## 19. Arquivos alterados (esta fase)

- `docs/VERCEL_DEPLOYMENT_CONFIGURATION.md`
- `docs/FASE_2_2_ROLLBACK.md`
- `docs/FASE_2_2_PREVIEW_RESULTADO.md` (este)
- `apps/web/src/lib/app-url.ts` — Preview usa `VERCEL_URL`
- `scripts/sanitize-preview-env-check.mjs` — helper (sem secrets no output)
- `apps/web/.vercel/` — link local (não versionar)

## 20. Variáveis necessárias (Preview)

| Variável | Preview | Obrigatória |
| -------- | ------: | ----------: |
| `DATABASE_URL` / `DIRECT_URL` | homolog **separada** | sim |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | sim | sim |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` / `WEB_URL` | host Preview ou confiar em `VERCEL_URL` | sim |
| `MERCADO_PAGO_ACCESS_TOKEN` | **TEST-*** apenas | sim |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | test | sim |
| `MERCADO_PAGO_WEBHOOK_SECRET` | sim | sim |
| `ALLOW_SIMULATED_PAYMENTS` | ausente/false | sim |

## 21. Rollback

Ver `docs/FASE_2_2_ROLLBACK.md`.

## 22. Riscos restantes

1. Working tree com Fase 2/2.1 sem commit — Preview Git Integration não reproduz o código homologado localmente.  
2. Banco Preview possivelmente = Production.  
3. Tokens MP Preview/Production compartilhados — risco de não-sandbox.  
4. Path Root Directory quebrado no deploy CLI.  
5. Webhook/cobrança sandbox **não** comprovados.

## 23. Veredito

```text
FASE 2.2 BLOQUEADA
```

```text
PRONTO PARA HOMOLOGAÇÃO EM PREVIEW
```

(estágio do sistema permanece o da Fase 2.1; Preview externo **não** validado)

---

## Ações necessárias do operador (desbloquear)

1. **Autorizar commit** das alterações Fase 2 + 2.1 + 2.2 (exceto secrets / `tsbuildinfo` / `.vercel`).  
2. No painel Vercel `ecopet-web` → Settings → General: confirmar Root Directory = `apps/web` e fazer deploy CLI **a partir da raiz do repo**, ou alinhar o setting.  
3. **Isolar Preview:** `DATABASE_URL`/`DIRECT_URL` só de homologação; tokens MP `TEST-*` só em Preview.  
4. Aprovar no Cursor o comando de pull sanitizado de env (ou confirmar manualmente: token `TEST-`, hosts URL, host DB).  
5. Reautorizar `vercel deploy --target=preview` a partir de `C:\Users\Valnia\Documents\ecopet_github`.  
6. Configurar webhook MP sandbox → `https://<preview>.vercel.app/api/webhooks/mercado-pago`.  
7. Rodar `WEB_URL=https://<preview>.vercel.app node --require ./apps/web/scripts/stub-server-only.cjs --import tsx scripts/test-fase2-commercial-flow.mjs` e cobrar sandbox real.

Sem essas ações, a Fase 2.2 **não** pode ser marcada como concluída nem como piloto controlado.
