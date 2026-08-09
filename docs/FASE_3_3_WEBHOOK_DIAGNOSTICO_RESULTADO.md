# Fase 3.3 — Fechamento definitivo do webhook Mercado Pago — Resultado

**Branch:** `test/fase-3-1-financial-preview`  
**Commits base:** `b0b2335` (+ patches Preview locais de assinatura, não commitados)  
**Deployment Preview:** `ecopet-55jom955v-ecopet-s-projects.vercel.app`  
**Alias:** `https://homolog.eccopet.com`  
**Projeto:** `ecopet-web`  
**Produção:** **não** alterada (código/deploy)  
**Atualizado:** 2026-08-08 (BRT) — retomada após separação Preview/Production do secret

---

## Veredito

```text
FASE 3.3 BLOQUEADA — ASSINATURA/ENTREGA NÃO VALIDADA
```

FASE 3.4: **NÃO EXECUTADA**.

---

## 1. Metadata do secret (sem valores)

| Check | Resultado |
| ----- | --------- |
| Escopos separados Preview vs Production | **sim** — 2 entradas distintas no `env ls` |
| Registro único compartilhado Preview+Production | **não** (removido) |
| Duplicatas no mesmo escopo | **não** |
| Preview atualizado recentemente | **sim** (~10m no `env ls`) |
| Production atualizado recentemente | **sim** (~9m no `env ls`) |

### Fingerprints (`env pull`, só metadata)

| Escopo | present | length | charset | sha256[:8] |
| ------ | ------- | -----: | ------- | ---------- |
| Preview | sim | **11** | mixed | `3930fb7a` |
| Production | sim | **11** | mixed | `3930fb7a` |
| Arquivo local `.env.preview.verify` | sim | **64** | hex | `bfcd6920` |

| Comparação | Resultado |
| ---------- | --------- |
| Preview == Production (fingerprint) | **sim** (mesmo valor nos dois escopos) |
| Preview == local verify (fingerprint) | **não** |

**Interpretação:** a separação de escopos funcionou, mas o **conteúdo** do Preview continua o secret antigo (11 chars), idêntico ao de Production — **não** o secret longo do painel MP modo teste (formato típico hex ~64).

Nenhuma alteração na lógica HMAC nesta retomada.

---

## 2. Redeploy Preview

| Item | Valor |
| ---- | ----- |
| Deploy | `dpl_3ker73ab…` / `ecopet-55jom955v…` |
| Target | Preview only |
| Alias | homolog → deployment acima |
| Health | 200 · `database=connected` |
| MP | `test` / `TEST_READY` |

---

## 3. Cobrança + webhook natural (sem poll)

| Marco | UTC |
| ----- | --- |
| T0 order | `2026-08-09T02:52:45.963Z` |
| T1 charge | `2026-08-09T02:52:47.590Z` |
| T2 accredited | `2026-08-09T02:52:50.052Z` |
| T3 natural | `2026-08-09T02:52:53.978Z` (~4s) |

| Campo | Resultado |
| ----- | --------- |
| Provider Order | `ORDTST01…SMPQ` (real) |
| Provider Payment | `PAY01KZJ…9A16` |
| Natural events | 2 × `order` / `order.processed` |
| `signatureValid` | **false** |
| `failureCode` | **`SIGNATURE_MISMATCH`** |
| Order final | `PENDING_CONFIRMATION` |
| Payment final | `PROCESSING` |
| Ledger | **0** |
| Reserve / partner payable | ausentes |
| Polling | **não usado** |

---

## 4. Causa raiz

```text
ASSINATURA — Preview e Production separados, porém ambos com o MESMO secret antigo (fingerprint 3930fb7a / length 11).
O secret do painel MP modo teste (fingerprint local bfcd6920 / length 64) NÃO está no Preview.
```

Entrega: **C — chega; assinatura rejeitada**.

---

## 5. Ação manual obrigatória

1. Painel MP (modo teste) → Webhooks → **revelar** secret.  
2. Vercel → `ecopet-web` → `MERCADO_PAGO_WEBHOOK_SECRET` → escopo **Preview only**: colar o valor **exato** do painel.  
3. Confirmar fingerprint Preview pós-update:  
   - `length` ≈ 64 e `charset=hex` (ou formato do painel),  
   - `sha8` **diferente** de `3930fb7a`,  
   - `previewEqualsProduction` = **false** (se Production mantém o antigo).  
4. Redeploy Preview + nova cobrança **sem poll**.

Não alterar HMAC. Não desativar assinatura. Não iniciar FASE 3.4 até passar.

---

## 6. Constraints

- [x] Sem Production deploy  
- [x] Sem merge `main`  
- [x] Sem commit automático  
- [x] Sem polling como prova  
- [x] Sem mudança de lógica HMAC nesta rodada  
- [x] FASE 3.4 não iniciada  

---

```text
FASE 3.3 BLOQUEADA — ASSINATURA/ENTREGA NÃO VALIDADA
```
