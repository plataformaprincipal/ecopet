# Fase 1 — Estabilização Crítica — Resultado

**Data:** 2026-08-06  
**Branch:** `fix/fase-1-estabilizacao-critica`  
**Restore point:** `release/etapa-5-auditoria-final` @ `95e8d1c`  
**Working tree inicial:** quase limpo (`tsconfig.tsbuildinfo` + `AUDITORIA_TECNICA_ECCOPET.md`)

---

## 1. Arquivos alterados / criados

### Migrations / Git
- `.gitignore` — exceção `!packages/database/prisma/migrations/**/*.sql`
- `packages/database/prisma/migrations/*/migration.sql` — **20** SQLs adicionados ao índice Git
- `docs/MIGRATION_RECOVERY_REPORT.md`

### Pagamentos simulados
- `apps/api/src/lib/simulated-payments.ts` (+ `.test.ts`)
- `apps/api/src/services/order-service.ts` — bloqueia `sim_*` em produção
- `apps/web/src/lib/payments/simulated-payments.ts` (+ `.test.ts`)
- `apps/web/src/lib/mercado-pago/apply-payment-status.ts` — rejeita simulado + origem não autorizada; registra `source`/`eventId`
- `apps/web/src/app/api/partner/orders/[orderId]/status/route.ts` — rejeita transição para `PAID`
- `apps/web/src/lib/validate-production-env.ts` — `ALLOW_SIMULATED_PAYMENTS` perigoso em prod
- `apps/web/src/lib/env-registry.ts` + `.env.example`

### Gate parceiro
- `apps/web/src/app/api/auth/register/route.ts` — parceiro nasce `PENDING`
- `apps/web/src/lib/auth/require-auth.ts` — `requireApprovedPartner` / `requireActivePartner` exigem ACTIVE+APPROVED+approvedAt
- `apps/web/src/lib/partner/access.ts` (+ `.test.ts`) — accessLevel full só aprovado
- `apps/web/src/app/(app)/partner/layout.tsx` — passa `approvedAt`
- `apps/api/src/middleware/partner-approval.ts` — gate Express
- `apps/api/src/routes/marketplace-partner.ts` — usa gate Express

### Express / disponibilidade
- `apps/web/src/lib/api-url.server.ts` — sem localhost em Vercel/production
- `apps/web/src/lib/api-errors.ts` — mensagens `CONFIG`/`CONNECTION`
- `docs/EXPRESS_DEPENDENCY_MAP.md`

### Testes / redirect cliente / ONG
- `apps/web/src/lib/permissions.ts`, `auth/dashboard.ts`, `middleware.ts` — redirect CLIENT → `/client`
- `scripts/test-client-experience.mjs` (expectativa alinhada via produto)
- `scripts/test-ngo-experience.mjs` — rotas PT atuais
- `scripts/test-partner-experience.mjs` — gate APPROVED
- `scripts/test-permissions.mjs` — dashboard `/client`
- `scripts/test.mjs` — inclui testes simulados + partner access

### Documentação
- `docs/FASE_1_ESTABILIZACAO_RESULTADO.md` (este arquivo)
- `AUDITORIA_TECNICA_ECCOPET.md` (pré-existente, não commitado nesta fase)

---

## 2. Migrations recuperadas

- **20** SQLs que estavam ignorados por `*.sql` agora versionáveis e staged.
- Total no índice: **27** `migration.sql`.
- Conteúdo histórico **não** alterado; banco local permanece “up to date” (sem reaplicação).
- Detalhes: `docs/MIGRATION_RECOVERY_REPORT.md`.

---

## 3. Pagamentos simulados bloqueados

| Regra | Status |
| ----- | ------ |
| `sim_*` não confirma pagamento em production / `VERCEL_ENV=production` | OK |
| Simulação só com `ALLOW_SIMULATED_PAYMENTS=true` fora de prod | OK |
| Flag rejeitada pelo `validate-production-env` em prod | OK |
| Partner `PATCH` status não pode setar `PAID` | OK |
| `applyInternalPaymentStatus` bloqueia simulado + origem não autorizada | OK |
| Express order-service não marca PAID com `sim_*` em prod | OK |
| Split **não** implementado (fora do escopo) | — |

Testes: `test:simulated-payments` — 10/10.

---

## 4. Fluxo de aprovação corrigido

```text
cadastro parceiro → accountStatus=PENDING + verificationStatus=PENDING
admin approve     → ACTIVE + APPROVED + approvedAt/approvedById
admin reject      → REJECTED + REJECTED (já existia)
admin suspend     → SUSPENDED + SUSPENDED (já existia)
```

Backend operacional (`requireApprovedPartner` / `requireActivePartner` + Express marketplace-partner):

- role PARTNER
- accountStatus ACTIVE
- verificationStatus APPROVED
- approvedAt preenchido

Shell `/partner` (profile/messages/settings) permanece acessível com limited; rotas comerciais bloqueadas no UI + API.

Testes: `test:partner-access-gate` 6/6; `test:partner-experience` OK; `test:admin-access` confirma approve + self-action bloqueada.

---

## 5. Mapa Express

Arquivo: `docs/EXPRESS_DEPENDENCY_MAP.md`.

Mitigações Fase 1:

- 503 explícito sem `API_INTERNAL_URL`
- bloqueio de localhost em Vercel/production
- mensagem de erro amigável (sem mock de dados)

Express **não removido**.

---

## 6. Testes corrigidos

| Suite | Diagnóstico | Correção |
| ----- | ----------- | -------- |
| `client-experience` | ERRO REAL DO PRODUTO — redirect `/cliente` vs experiência `/client` | Produto: default dashboard + middleware → `/client` |
| `ngo-experience` | TESTE DESATUALIZADO — rotas EN antigas vs nav PT | Teste alinhado a `animais`/`adocoes`/`campanhas`/`configuracoes` |
| `partner-experience` | Especificação mudou (gate obrigatório) | Expectativa: ACTIVE sem APPROVED → limited |

---

## 7. Comandos executados (validação final)

| Comando | Resultado |
| ------- | --------: |
| `npm ci` | EXIT 0 |
| `npm run db:generate` | EXIT 0 |
| `npm run lint` | EXIT 0 |
| `npm run type-check` | EXIT 0 |
| `npm run build` | EXIT 0 |
| `npm run test` | EXIT 0 |
| `npx prisma validate --schema=packages/database/prisma/schema.prisma` | EXIT 0 |
| `npx prisma migrate status --schema=...` | EXIT 0 — 27 migrations, up to date |
| `git check-ignore` em migration recuperada | exit 1 (não ignorada) |

---

## 8. Erros restantes (não bloqueadores desta fase)

- `npm audit`: vulnerabilidades em deps (fora do escopo Fase 1).
- HTTP de permissions/admin **pulados** quando servidor local não está up — esperado.
- UIs ainda acopladas ao Express quebram em Vercel sem API separada (documentado; 503 honesto).
- Confirmação de e-mail / split / repasse — **fora do escopo** desta fase.
- Parceiros já existentes como ACTIVE sem APPROVED no DB de homologação podem precisar de revisão admin pontual.

---

## 9. Riscos para deploy

| Risco | Mitigação |
| ----- | --------- |
| Esquecer de push das 20 migrations | Merge desta branch + conferir 27 SQLs no remote |
| Parceiros legados ACTIVE sem APPROVED | Script ops de aprovação em massa ou fila admin |
| Express crítico (bootstrap gestor, pets ricos) off na Vercel | Migrar ou hospedar API (ver mapa) |
| `ALLOW_SIMULATED_PAYMENTS` setado na Vercel | `validate-production-env` falha |

---

## 10. Próximos passos (não executados)

1. Commit/push desta branch (quando solicitado).
2. Fase 2: unificar carrinho Zustand → API; alinhar type-check com generate no CI.
3. Migrar consumidores Express críticos (pets, appointments, chat) para Next.
4. Homologar Mercado Pago sandbox + webhook.
5. Split/repasse / confirmação de e-mail — fases posteriores.

---

## Veredito

```text
FASE 1 CONCLUÍDA
```

Todos os cinco bloqueadores da fase foram tratados com evidência de teste/comando. Nenhum bloqueador listado permanece aberto dentro do escopo definido.
