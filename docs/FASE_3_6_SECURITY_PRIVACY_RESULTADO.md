# FASE 3.6 — Segurança, privacidade e compliance técnico — Resultado

**Atualizado:** 2026-08-09  
**Escopo:** Preview/homolog — sem pentest Production

---

## Veredito

```text
FASE 3.6 PARCIAL — CORREÇÕES NECESSÁRIAS
```

---

## Threat model (resumo)

| Ator | Capacidade | Controles observados |
| ---- | ---------- | -------------------- |
| Cliente malicioso | IDOR orders/ledger | Fase 3: 403/404 |
| Parceiro malicioso | auto-PAID / foreign product | Fase 2/3: 403/404 |
| Webhook falso | forge HMAC | fail-closed 401 (também bloqueia legítimo hoje) |
| Bot / stuffing | register/login | Turnstile + rate limit (Preview bypass E2E) |
| Insider admin | financeiro | audit log; dual approval flags |

---

## Achados

### Critical
| ID | Achado | Notas |
| -- | ------ | ----- |
| SEC-C1 | Webhook MP natural rejeitado (`SIGNATURE_MISMATCH`) | Operacional/segurança de integridade — secret Preview ≠ assinatura MP **ou** app errada. Bloqueia piloto. |

### High
| ID | Achado |
| -- | ------ |
| SEC-H1 | Deployment Protection depende de bypass na URL do webhook — superfície se secret bypass vazar |
| SEC-H2 | Reconciliação não valida amount externo do provider |

### Medium
| ID | Achado |
| -- | ------ |
| SEC-M1 | finance-auth unit tests são contratos puros (HTTP IDOR coberto parcialmente por Fase 3) |
| SEC-M2 | Float monetary fields no Order (legado) |
| SEC-M3 | Scripts `_tmp-*` locais com potencial de env — não devem ir ao Git |

### Low
| ID | Achado |
| -- | ------ |
| SEC-L1 | Email DEV_ONLY em runners locais |

---

## Controles verificados (amostra)

| Controle | Evidência |
| -------- | --------- |
| Auth register/login homolog | Fase 2 |
| IDOR partner/client | Fase 2/3 |
| Webhook sem bypass | Vercel 401 Protected |
| Webhook sig inválida | EccoPet 401 |
| Simulated payments fail-closed | config + código |
| `$queryRawUnsafe` scan rápido | sem hits óbvios em `apps/web/src` (amostra) |
| Turnstile test keys | E2E dummy token Preview |
| E2E gates Production | validate-production-env patterns |

---

## LGPD (alto nível)

Dados: contas, pets, pedidos, endereços, mensagens, pagamentos (tokens não armazenados).  
Exclusão vs retenção financeira: **não** exercitada end-to-end nesta fase — marcar P1.

---

## Correções

Nenhuma vulnerabilidade de código explorável de double-spend encontrada nesta rodada.  
P0 operacional: alinhar secret webhook Preview com painel MP (FASE 3.3).

---

## Riscos residuais

Critical aberto (webhook) → **bloqueia FASE 3.7**.
