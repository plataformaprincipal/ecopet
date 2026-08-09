# Fase 3.3 — Fechamento definitivo do webhook Mercado Pago — Resultado

**Branch:** `test/fase-3-1-financial-preview`  
**Base:** `5afc072` (+ patches locais de assinatura / recon / docs — não commitados)  
**Deployment:** `ecopet-mm3co6q98-ecopet-s-projects.vercel.app`  
**Alias:** `https://homolog.eccopet.com`  
**Projeto:** `ecopet-web`  
**Produção:** **não** alterada  
**Atualizado:** 2026-08-09T04:28Z

---

## Veredito

```text
FASE 3.3 BLOQUEADA — ASSINATURA/ENTREGA NÃO VALIDADA
```

Classificação P0:

```text
P0 EXTERNO/INTEGRAÇÃO — SECRET DO PAINEL MP ≠ SECRET NO PREVIEW
(manifest SDK-aligned; HMAC natural diverge com 2 fingerprints distintos)
```

---

## O que foi fechado neste ciclo (código)

| Item | Status |
| ---- | ------ |
| Auditoria vs SDK `mercadopago@3.3.0` `WebhookSignatureValidator` | OK — template `id:;request-id:;ts:;`, omit missing, HMAC-SHA256 hex |
| `query data.id` (+ fallback URL raw) | OK |
| Case original / lower / upper | OK (5 candidatos) |
| Diagnostics sanitizados (`secretLen/sha8`, `expHmacSha8`, `recvHmacSha8`, …) | OK |
| Vetores unitários (válida / ts / req / data.id / secret / case) | OK — `test:mercado-pago` 21/21 |
| Fail-closed (assinatura não desativada) | OK |

---

## Secrets runtime (sanitizado)

| Momento | secretLen | secretSha8 | Resultado natural |
| ------- | --------- | ---------- | ----------------- |
| Pré-sync | 64 | `9d2804a9` | SIGNATURE_MISMATCH |
| Pós-sync (`.env.preview.verify` → Vercel Preview) + redeploy | 64 | `bfcd6920` | SIGNATURE_MISMATCH |

`vercel env pull` continua redigindo Sensitive como `[SENSITIVE]` (`sha8=3930fb7a`) — **não** usar como prova.

---

## Prova natural (último ciclo — sem poll)

| Campo | Valor |
| ----- | ----- |
| Charge | sandbox Orders `accredited` |
| Provider Order | `ORDTST01…YHGD` |
| Natural T3 | ~2s após charge (`2026-08-09T04:28:17.610Z`) |
| `signatureValid` | **false** |
| `failureCode` | **SIGNATURE_MISMATCH** |
| Diagnostics (exemplo) | `queryDataId=1 bodyDataId=1 dataCase=upper candidates=5 expHmacSha8=482fb3ca recvHmacSha8=a54f4a24` |
| Order/Payment PAID | **não** |
| Ledger / reserve / payable | **não** |
| Polling | **não usado** |

Conclusão: entrega natural **comprovada**; autenticidade HMAC **não** — o canal chega, mas o secret usado no Preview **não** reproduz o `v1` do Mercado Pago.

---

## Ação manual obrigatória (bloqueador)

1. Abrir **Suas integrações** da **mesma** app TEST que emite `APP_USR-02…` / token Preview.  
2. Webhooks → **revelar** Assinatura secreta **atual** (se Reset, copiar o novo).  
3. Atualizar Preview `MERCADO_PAGO_WEBHOOK_SECRET` com esse valor exato.  
4. Redeploy Preview; confirmar no reject que `secretSha8` mudou.  
5. Nova cobrança sandbox + webhook natural → exigir `signatureValid=true` + Payment/Order PAID + ledger.

Não desativar assinatura. Não usar polling como substituto.

---

## Constraints

- [x] Sem Production deploy / DB / MP prod  
- [x] Sem merge `main`  
- [x] Sem commit automático  
- [x] Sem polling como prova  
- [x] Assinatura permanece obrigatória  

---

```text
FASE 3.3 BLOQUEADA — ASSINATURA/ENTREGA NÃO VALIDADA
```
