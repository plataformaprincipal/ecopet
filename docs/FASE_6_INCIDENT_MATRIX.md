# FASE 6 — Matriz de incidentes (pré-piloto + gates)

Fonte: Fases 3.3–5 + provas naturais. Nenhum incidente de piloto real (piloto não aberto).

| ID | DATA | TIPO | SEV | FLUXO | AFETADOS | PEDIDO | $ IMPACT | OPS | UX | CAUSA APARENTE | CAUSA RAIZ | REPRO? | FREQ | WORKAROUND | CORREÇÃO | TESTE | STATUS | OWNER |
| -- | ---- | ---- | --- | ----- | -------- | ------ | -------- | --- | -- | -------------- | ---------- | ------ | ---- | ---------- | -------- | ----- | ------ | ----- |
| INC-SIG-001 | 2026-08-09 | webhook auth | **P0** | MP→webhook→PAID | todos pagamentos naturais Preview | `ORDTST…YHGD` etc. | bloqueia confirmação oficial | alto | checkout fica PROCESSING | HMAC diverge | **Secret Preview ≠ secret com que o MP assina** (painel/app); manifest SDK-aligned esgotado (candidates=5, queryDataId=1) | SIM | alta (todo natural) | nenhum seguro (não desligar sig) | revelar secret painel mesma app TEST; atualizar Preview; redeploy; re-provar natural | unit vectors HMAC + diagnostics sanitizados | **ABERTO** | Ops/MP + Eng |
| INC-PROD-MP-001 | 2026-08-09 | config Production | **P0** | payment Production | N/A | — | risco go-live sem token | alto | — | vars ausentes | Access Token / Public Key / ENVIRONMENT não cadastrados em Production | SIM | permanente até fix | manter PAYMENT_PROVIDER=none | cadastrar credenciais Production (auth humana) + `check:production-env` | validator script | **ABERTO** | DevOps/Fin |
| INC-BACKUP-001 | 2026-08-09 | DR | P1 | DB | plataforma | — | RTO/RPO desconhecidos | médio | — | drill não feito | restore isolado nunca comprovado | N/A | 1 | docs only | executar restore em projeto isolado | checklist tabelas críticas | **ABERTO** | SRE |
| INC-DRYRUN-001 | 2026-08-09 | ops readiness | P1 | dia operacional | piloto | — | operação não ensaiada | alto | — | gate 3.3 | dry-run 3.7 bloqueado por assinatura | N/A | 1 | — | fechar INC-SIG-001 depois dry-run | runbook piloto | **ABERTO** | Ops |
| INC-BYPASS-001 | 2026-08-09 | security/ops | P1 | webhook URL | Preview | — | superfície se vazar bypass | médio | — | Deployment Protection | URL homolog inclui bypass automation | SIM | contínuo | rotacionar secret; preferir Protection policy | avaliar auth dedicada / IP allowlist MP | probes negativos | **ABERTO** | Sec/DevOps |
| INC-RECON-LEGACY | pré-3.5 | finance | P1→mitigado código | reconciliation | finança | — | mismatch silencioso | médio | — | amount local copiado | código antigo usava payment.amount local | SIM | — | — | provider-aware amount + classify | `reconciliation.test.ts` | **MITIGADO em WT** (não commitado) | Fin Eng |
| INC-FLOAT-001 | contínuo | money precision | P2 | Order/ledger | finança | — | drift 1¢ possível | baixo | — | Float em Order | tipos mistos Int cents vs Float | SIM | estrutural | toCents antes ops | migração futura | money tests | **DOCUMENTADO** | Fin Eng |

### Regra Fase 6

**Nenhum P0 pode ficar aberto** para autorizar Fase 7 → **INC-SIG-001** e **INC-PROD-MP-001** bloqueiam.
