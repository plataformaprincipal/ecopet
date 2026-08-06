# Fase 2.1 — Homologação Sandbox — Resultado

**Branch:** `feat/fase-2-fluxo-comercial-minimo`  
**Data:** 2026-08-06  
**Commit:** não criado (working tree para revisão)

---

## 1. Resumo executivo

Homologação local do funil comercial mínimo **comprovada** com servidor real (`WEB_URL`), banco Supabase, Express 410, build `npm run start`, reinicialização e idempotência. Preview Vercel **não** foi executado (CLI/projeto não vinculados neste ambiente).

## 2. Revisão do working tree

Ver `docs/WORKING_TREE_REVIEW.md`.

- Nenhum secret versionado.
- `apps/web/tsconfig.tsbuildinfo` → **não** commitar.
- Migration Fase 2 rastreável (untracked, não ignorada).
- Resíduos Fase 1 misturados no tree — classificados para entrar no mesmo commit futuro se desejado.

## 3. Migration da Fase 2

| Check | Resultado |
| ----- | --------- |
| `prisma validate` | EXIT 0 |
| `prisma migrate status` | EXIT 0 — 28 migrations, up to date (dev) |
| `git check-ignore` + status | SQL **não** ignorado; aparece como `??` (precisa `git add`) |
| Históricas editadas | Não |
| Reset | Não executado |
| Produção | **Não** aplicada automaticamente |

### Procedimento seguro futuro (homologação/produção)

```bash
# 1. Backup do banco
# 2. Revisar migration SQL
# 3. Aplicar somente deploy (sem reset):
npm run db:migrate:deploy
# equivalente:
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
```

Campos novos com `DEFAULT` / `IF NOT EXISTS` — risco baixo de perda de dados; `idempotencyKey` unique nullable.

## 4. Ambiente local

| Item | Evidência |
| ---- | --------- |
| Next `npm run dev` / `npm run start` | health 200 |
| Express `npm run dev -w @ecopet/api` | health 200 |
| Prisma/DB | checkout + pedidos persistidos no Supabase |
| `WEB_URL` | `http://localhost:3000` (shell, não versionado) |
| Webhook secret homologação | via env shell `MERCADO_PAGO_WEBHOOK_SECRET` (não commitado) |
| `ALLOW_SIMULATED_PAYMENTS` | `false` |
| Funil comercial | Next Route Handlers (sem Express) |

## 5. E2E HTTP

Script: `scripts/test-fase2-commercial-flow.mjs`  
Comando:

```bash
WEB_URL=http://localhost:3000 EXPRESS_URL=http://localhost:4000 \
node --require ./apps/web/scripts/stub-server-only.cjs --import tsx scripts/test-fase2-commercial-flow.mjs
```

| Execução | Resultado |
| -------- | --------- |
| Dev server | **23/23 ok** (~176s) EXIT 0 |
| Production `npm run start` | **23/23 ok** (~120s) EXIT 0 |

### Cobertura vs requisitos

| # | Item | Evidência |
| - | ---- | --------- |
| 1 | Auth cliente | register/login 201/200 |
| 2 | Auth parceiro aprovado | approve + product 201 |
| 3 | Produto ativo | POST `/api/partner/products` |
| 4 | Carrinho | POST `/api/cart/items` 201 |
| 5 | Preço servidor | total 40 com payload cliente 0.01 |
| 6–8 | Checkout PENDING + snapshot | `PENDING_CONFIRMATION`, pricingVersion/fees |
| 9–11 | Pagamento + PAID autorizado | `applyInternalPaymentStatus(source=webhook)` — sem cobrança real |
| 12–13 | Cliente/parceiro veem | 200 |
| 14 | Pedido alheio | 404 |
| 15 | Parceiro → PAID | 403 |
| 16 | Cancelamento pré-pago | CANCELLED |
| 17 | Refund request | 400 (não marca REFUNDED só por API) |
| 18 | Audit | auditCountRecent ≥ 1 |

**Nota:** confirmação PAID no E2E usa a mesma função do webhook (`source=webhook`) com valor conferido; assinatura HMAC inválida é exercitada via HTTP real (401). Cobrança MP Orders API real não foi disparada (sandbox credentials opcionais).

## 6. Testes positivos

- Checkout com snapshot `grossAmount=40`, `platformFeeAmount=4`, `partnerAmount=36`, `pricingVersion=v1`
- Estoque decrementado no checkout
- Carrinho limpo após checkout
- Payment nasce `PENDING`
- Order → `PAID` / Payment → `APPROVED` só após fonte autorizada
- Partner `PREPARING` após PAID

## 7. Testes negativos

| Caso | HTTP/Resultado |
| ---- | -------------- |
| Preço manipulado | Ignorado; total servidor 40 |
| Pedido alheio | 404 |
| Produto alheio | 404 |
| Parceiro pendente | 403 |
| Parceiro set PAID | 403 |
| Webhook assinatura inválida | **401** `SIGNATURE_MISMATCH` |
| Webhook duplicado (apply) | `changed=false` |
| Valor divergente | `changed=false`, permanece PENDING_CONFIRMATION |
| Express legado | **410** `COMMERCIAL_API_MOVED` |

## 8. Persistência no banco

Validado via Prisma no E2E + após restart:

- Order do cliente correto / partner correto
- OrderItem snapshot (price, partnerId, pricingVersion, fees)
- Payment não nasce PAID
- Cart vazio pós-checkout
- Stock atualizado
- Notifications + AuditLog recentes presentes

IDs de amostra (não sensíveis): pedidos de teste `fase21.*@test.ecopet.local` — limpeza não automática (dados de teste).

## 9. Idempotência

- Checkout com mesmo `Idempotency-Key` → mesmo `orderId`
- Segunda aplicação APPROVED → `changed=false`
- Após reinício do servidor → ainda `changed=false`

## 10. Reinicialização

1. Snapshot DB: `PREPARING` / payment `APPROVED` / pricing ok  
2. Next encerrado (`WEB_DOWN_OK`)  
3. Next reiniciado  
4. HTTP login + order → `PREPARING` / `APPROVED`  
5. Duplicate apply → sem mudança  
6. Webhook inválido → 401  

Estados **não** dependem de memória do processo.

## 11. Build de produção local

| Comando | EXIT |
| ------- | ---: |
| `npm run build` | 0 |
| `npm run start -w @ecopet/web` | OK (Ready) |
| health / webhook 401 / Express 410 | OK |
| E2E completo em `start` | 23/23 EXIT 0 |

## 12. Preview Vercel

| Item | Status |
| ---- | ------ |
| `apps/web/vercel.json` | Root relativo monorepo: `installCommand`/`buildCommand` com `cd ../..` |
| Framework | nextjs, region `gru1` |
| Vercel CLI / `.vercel` / `gh` | **Ausentes** neste ambiente |
| Deploy Preview | **Não executado** |
| Webhook em domínio Preview | N/A — documentar: usar secret sandbox + URL Preview; se MP não aceitar, usar poll autorizado só em homologação |

Configuração compatível esperada no painel:

- Root Directory: `apps/web`
- Install: `cd ../.. && npm ci`
- Build: `cd ../.. && npm run build`
- Node ≥ 20
- Env Preview: DB + MP **test** + `ALLOW_SIMULATED_PAYMENTS` unset/false

## 13. Variáveis de ambiente

| Variável | Local | Teste | Preview | Produção futura | Obrigatória |
| -------- | ----: | ----: | ------: | --------------: | ----------: |
| `DATABASE_URL` | sim | sim | sim | sim | sim |
| `DIRECT_URL` | migrate | migrate | migrate | migrate | sim (migrate) |
| `AUTH_SECRET` / session secret do app | sim | sim | sim | sim | sim |
| `NEXTAUTH_SECRET` | se usado | se usado | se usado | se usado | condicional |
| `NEXTAUTH_URL` / `APP_URL` / `NEXT_PUBLIC_APP_URL` | local URL | test URL | preview URL | prod URL | sim |
| `WEB_URL` | scripts | scripts | opcional | opcional | testes HTTP |
| `PAYMENT_PROVIDER` | mercado_pago/none | test | test | mercado_pago | sim |
| `MERCADO_PAGO_ACCESS_TOKEN` | TEST-* | TEST-* | TEST-* | APP_USR-* | sim p/ cobrar |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | test | test | test | prod | checkout UI |
| `MERCADO_PAGO_WEBHOOK_SECRET` | homolog shell | sim | sim | sim | **sim** (fail-closed) |
| `ALLOW_SIMULATED_PAYMENTS` | false | false | **false** | **false** | deve ser false |

**Obrigatório:** `ALLOW_SIMULATED_PAYMENTS` não pode ser `true` em Preview comercial ou produção.

## 14. Arquivos alterados (Fase 2.1)

Além do tree da Fase 2:

- `docs/WORKING_TREE_REVIEW.md` (novo)
- `docs/FASE_2_1_HOMOLOGACAO_SANDBOX_RESULTADO.md` (este)
- `scripts/test-fase2-commercial-flow.mjs` (ampliado)
- `apps/api/src/index.ts` — 410 **antes** do auth
- `apps/web/src/lib/mercado-pago/webhooks/pipeline.ts` — fail-closed sem secret
- `apps/web/src/lib/mercado-pago/webhook-signature.ts` — secret env sem ACCESS_TOKEN; `secret:""` explícito

## 15. Testes executados e códigos de saída

| Comando | EXIT | Nota |
| ------- | ---: | ---- |
| `npx prisma validate` | 0 | |
| `npx prisma migrate status` | 0 | 28 up to date |
| `npm run db:generate` | 0 | (após parar Next; EPERM se server lock) |
| `npm run lint` | 0 | |
| `npm run type-check` | 0 | heap 8GB |
| `npm run build` | 0 | |
| `npm run test` | 0 | após parar servers |
| `npm run test:mercado-pago` | 0 | 20/20 |
| E2E dev | 0 | 23/23 |
| E2E `npm run start` | 0 | 23/23 |
| `npm ci` | — | **não reexecutado** no fechamento (evita churn com tree sujo); `node_modules` já íntegro |

## 16. Falhas restantes

- Preview Vercel não deployado / não exercitado
- Cobrança real Mercado Pago Orders API (sandbox) não disparada ponta a ponta (PAID via apply autorizado equivalente ao handler)
- `npm run test` com server de produção no ar pode falhar HTTP de permissions (payload antigo) — com server parado, suite OK
- Dados de teste `fase21.*` permanecem no banco (sem cleanup automático)
- Checkout de serviços ainda fora do funil

## 17. Riscos para piloto

- Sem Preview: variáveis/região/webhook público não validados na Vercel
- Sem split/repasse
- Webhook exige secret sempre (fail-closed) — Preview sem secret quebra notificações
- Migration ainda não aplicada em produção

## 18. Procedimento de rollback

1. Reverter deploy/código da branch  
2. **Não** rodar `migrate reset`  
3. Se migration já aplicada: manter colunas (defaults seguros) ou migration down manual revisada  
4. Desativar `ALLOW_SIMULATED_PAYMENTS`  
5. Rotacionar secrets MP se vazaram em logs (não ocorreram nesta sessão)

## 19. Veredito

```text
FASE 2.1 PARCIALMENTE CONCLUÍDA
```

```text
PRONTO PARA HOMOLOGAÇÃO EM PREVIEW
```

Justificativa: E2E HTTP, negativos, idempotência, reinício e build de produção local passaram sem pagamento real; falta apenas validação em Preview Vercel (ambiente não conectado). **Não** classificado como piloto controlado.
