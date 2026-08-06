# Fase 3.1 — Homologação financeira externa em Preview — Resultado

**Branch:** `test/fase-3-1-financial-preview`  
**Atualizado:** 2026-08-06 (revalidação de infraestrutura — migrate/deploy/E2E não iniciados)  
**HEAD inicial da revalidação:** `b3b8d9a`  
**Projeto canônico:** `ecopet-s-projects/ecopet-web`  
**Produção:** `https://www.eccopet.com` (**não** alterada)

---

## 1. Resumo executivo

A Fase 3.1 foi **retomada e permanece bloqueada** por infraestrutura.  
`scripts/check-preview-environment.mjs` retornou **exit 2**. Por regra da fase, **não** foram executados: migrations, deploy Preview, smoke externo, E2E, cobrança sandbox nem webhook.

Código Fase 3 commitado (`84d1b67`); prep infra commitada (`b3b8d9a`).

Motivos vigentes:

```text
banco de homologação isolado ainda não comprovado;
credenciais Mercado Pago TEST ainda não comprovadas;
URL Preview estável ainda não validada.
```

---

## 2. Git e branch

| Item | Estado |
| ---- | ------ |
| Branch | `test/fase-3-1-financial-preview` |
| Working tree (início) | Limpo |
| `b3b8d9a` | Presente — prep infra Preview |
| `0c6a97b` | Presente — ignore tsbuildinfo |
| `84d1b67` | Presente — ledger / Fase 3 |
| Migration Fase 3 | Rastreada (`20260806180000_fase3_financial_ledger`) |
| Secrets versionados | Não (apenas `.env*.example` / código de tokens) |
| Merge `main` | Não |
| Deploy Production | Não |
| Credenciais Production usadas | Nenhuma |

Pré-checks:

```text
[x] working tree limpo (início)
[x] branch correta
[x] commit b3b8d9a presente
[x] commit 84d1b67 presente
[x] migration da Fase 3 rastreada
[x] nenhum secret versionado
```

---

## 3. Isolamento do banco

Ver `docs/FASE_3_1_ENVIRONMENT_ISOLATION.md`.

| Check | Status |
| ----- | ------ |
| `DATABASE_URL` / `DIRECT_URL` só Preview | **Não** — escopo `Production, Preview` |
| Fingerprint Preview ≠ Production | **Não comprovado** (pull `[SENSITIVE]`) |
| Banco identificado como homologação | **Não** |
| `migrate deploy` | **Não executado** |

---

## 4. Mercado Pago TEST

| Check | Status |
| ----- | ------ |
| Access token prefixo TEST | **Não comprovado** (pull redigido) |
| Public key prefixo TEST | **Não comprovado** |
| Webhook secret homolog | Presente no Vercel, valor redigido; escopo compartilhado |
| Escopo só Preview | **Não** — `Production, Preview` |
| `ALLOW_SIMULATED_PAYMENTS` | Ausente no Preview (adequado) |

---

## 5. Feature flags

| Flag | Preview Vercel |
| ---- | -------------- |
| `FINANCIAL_LEDGER_ENABLED` | **Ausente** |
| `PAYOUTS_ENABLED` | **Ausente** |
| `MANUAL_PAYOUT_APPROVAL_REQUIRED` | **Ausente** |
| `RESERVE_ENABLED` | **Ausente** |
| `CHARGEBACKS_ENABLED` | **Ausente** |
| `DAILY_RECONCILIATION_ENABLED` | **Ausente** |

---

## 6. Configuração Vercel

| Campo | Valor | OK |
| ----- | ----- | -- |
| Projeto | `ecopet-web` | Sim |
| Root Directory | `apps/web` | Sim |
| Framework | Next.js | Sim |
| Output Directory | Next.js default | Sim (não `public`) |
| Node | 24.x | Sim |
| `homolog.eccopet.com` | **Não configurado** | Não |
| Path `apps/web/apps/web` | Evitar no deploy CLI | Documentado |
| Projeto `ecopet_github` | Existe — **não usar** | Atenção |

Variáveis de homologação **não** estão isoladas no escopo Preview-only para DB/MP/URLs.

---

## 7. Migrations

| Ação | Status |
| ---- | ------ |
| `npm run db:generate` | **Não executado** (bloqueio) |
| `npm run db:migrate:deploy` | **Não executado** |
| `prisma migrate status` | **Não executado** |
| `migrate reset` | Não |
| Acesso DB Production | Não |

---

## 8. Deploy Preview

**Não executado** (check exit ≠ 0).

---

## 9. Smoke tests externos

**Não executados.**

---

## 10. E2E comercial externo

**Não executado.**

---

## 11. E2E financeiro externo

**Não executado.**

---

## 12. Cobrança Mercado Pago sandbox

**Não executada.**

---

## 13. Webhook externo

**Não configurado / não validado.**  
Rota alvo planejada (quando houver URL estável): conforme código em `/api/webhooks/mercado-pago` + `https://homolog.eccopet.com`.

---

## 14. Idempotência e concorrência

**Não testadas** em Preview.

---

## 15. Ledger / split / reserva / saldos

**Não homologados** em Preview.  
(E2E local Fase 3 histórico 16/16 **não** substitui Preview.)

---

## 16. Payout lógico

**Não homologado** em Preview. Sem repasse bancário real.

---

## 17. Reembolso sandbox

**Não executado.**

---

## 18. Chargeback

**Não classificado nesta rodada** (sem teste sandbox).  
Quando executado: marcar `EXTERNO REAL` / `INTERNO CONTROLADO` / `NÃO SUPORTADO PELO SANDBOX` sem confundir categorias.

---

## 19. Conciliação

**Não homologada** em Preview.

---

## 20. Logs Vercel / rollback flag

Revisão de logs de deploy financeiro: **N/A** (sem deploy).  
Teste `PAYOUTS_ENABLED=false` em Preview: **não executado**.

---

## 21. Validação local (npm ci / lint / type-check / build / tests)

**Não reexecutada nesta retomada** — bloqueio ocorreu na etapa 2 (infra).  
Validação da prep anterior (`lint` / `type-check` / `node --check` do script) permanece como referência de código; não desbloqueia Preview.

---

## 22. Script de verificação

```text
node scripts/check-preview-environment.mjs apps/web/.env.preview.pull
→ RESULTADO: BLOQUEADO
→ exit code: 2
```

Ajuste local (working tree): quando um arquivo é passado, o script usa **somente** o arquivo (evita poluição do `process.env` local). Sem commit automático.

---

## 23. Falhas restantes

1. Banco homologação isolado não comprovado (escopo DB compartilhado).  
2. MP TEST não comprovado (pull redigido + escopo compartilhado).  
3. `homolog.eccopet.com` não configurado.  
4. Flags financeiras Preview ausentes.  
5. Pull Vercel redige secrets — check exit 0 exige arquivo Preview com valores reais fornecidos com segurança pelo responsável (não versionar).  
6. Migrations / deploy / E2E / sandbox / webhook pendentes.

---

## 24. Riscos

| Risco | Impacto |
| ----- | ------- |
| Migrar/deploy com DB compartilhado | Ledger/payouts no banco de Production |
| Tokens MP compartilhados | Mistura sandbox/live ou webhooks cruzados |
| URL volátil / sem homolog | Webhook e auth frágeis |
| Flags ausentes | Comportamento default do código ≠ contrato de homologação |

---

## 25. Veredito

```text
FASE 3.1 BLOQUEADA
PRONTO PARA HOMOLOGAÇÃO FINANCEIRA
```

**Não** `PRONTO PARA PILOTO FINANCEIRO CONTROLADO` — checklist de piloto não atendido.

### Critérios piloto (estado)

```text
[ ] banco de homologação isolado
[ ] deploy Preview funcional
[ ] E2E comercial externo aprovado
[ ] E2E financeiro externo aprovado
[ ] cobrança sandbox real
[ ] webhook externo real
[ ] ledger idempotente
[ ] split consistente
[ ] reserva validada
[ ] saldo derivado do ledger
[ ] payout sem dinheiro real validado
[ ] reembolso sandbox validado
[ ] chargeback corretamente classificado
[ ] conciliação validada
[x] nenhuma credencial de produção utilizada nesta fase
[x] nenhum pagamento ou repasse real
```

### Próximo desbloqueio

1. Completar `docs/FASE_3_1_MANUAL_INFRASTRUCTURE_CHECKLIST.md`.  
2. DNS `homolog.eccopet.com` + vars Preview-only.  
3. `check-preview-environment.mjs` → exit 0.  
4. Então: migrate homolog → deploy Preview `ecopet-web` → E2E → sandbox → webhook.
