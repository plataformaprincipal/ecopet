# Dependencies Security Report — EcoPet

**Data:** 2026-07-20  
**Comando:** `npm audit --omit=dev`  
**Escopo:** dependências de produção do monorepo

---

## 1. Resumo

| Severidade | Contagem |
|------------|----------|
| Critical | **0** |
| High | **5** |
| Moderate | **9** |
| Low | **1** |
| **Total** | **15** |

**Conclusão:** presença de High **impede** “APROVADO PARA PRODUÇÃO” sem remediation ou aceite formal de risco.

---

## 2. Achados High (produção)

| Pacote | Via / árvore | Issue | Impacto potencial | Ação recomendada |
|--------|--------------|-------|-------------------|------------------|
| `ws` | `engine.io` → `socket.io-adapter` | Memory exhaustion DoS (fragmentos) | DoS se WebSocket/socket.io exposto | Atualizar socket.io/engine.io para release com `ws` patched |
| `form-data` | transitivo | CRLF injection em multipart field names | Integridade de uploads HTTP multipart | Atualizar cadeia que puxa `form-data` vulnerável |
| `nodemailer` | `next-auth` | SMTP command injection via `envelope.size` | Se next-auth/nodemailer usados com envelope controlado por input | Atualizar `nodemailer` / `next-auth`; validar se path está ativo no EcoPet |
| (cadeia) | `engine.io` / `socket.io-adapter` | depende de `ws` High | Mesmo DoS | Bump coordenado |
| (cadeia) | demais High reportados no audit agregados | — | — | `npm audit` detalhado + PR de bump |

> Contagem “5 high” do metadata npm agrega nós da árvore (incluindo pais que herdam o advisory).

---

## 3. Achados Moderate (amostra)

| Pacote | Nota |
|--------|------|
| `@google-cloud/storage` / `firebase-admin` | Cadeia Google Cloud — monitorar bump `firebase-admin` |
| `next` → `postcss` | XSS em stringify CSS — impacto limitado se não processar CSS não confiável |
| `uuid` (gaxios/teeny-request/next-auth) | Bounds check em v3/v5/v6 |
| `body-parser` | Low/DoS se limit inválido |
| `retry-request` / `teeny-request` / `gaxios` | Transitivos Firebase/Google |

**Não** forçar downgrade antigo de `firebase-admin` (histórico do projeto).

---

## 4. Licenças

| Aspecto | Status |
|---------|--------|
| App proprietário EcoPet | private monorepo |
| Scan automatizado de licenças SPDX | **Não executado nesta rodada** |
| Risco copyleft surpresa | Baixo para stack típica MIT/Apache (Next, Prisma, etc.) |

Recomendação produção: `license-checker` ou FOSSA/Snyk license policy em CI.

---

## 5. Versões / higiene

| Item | Status |
|------|--------|
| Next.js 15.5.x | Em uso (manter patch channel) |
| Prisma 6.19.x | Em uso |
| Lockfile | npm workspaces — commits devem incluir `package-lock.json` |
| `npm audit` em CI | Recomendado fail em critical/high |

---

## 6. Plano de remediação

1. Rodar `npm audit` e `npm ls ws form-data nodemailer` para pin da árvore.  
2. Preferir upgrades oficiais; evitar `npm audit fix --force` cego (pode reverter firebase-admin).  
3. Após bump: `npm run lint && npm run type-check && npm run test:mercado-pago && npm run test:firebase`.  
4. Reavaliar High → 0 antes do go-live.

---

## 7. Status vs. produção

| Critério | Resultado |
|----------|-----------|
| 0 Critical | ✅ |
| 0 High | ❌ (5) |
| Política de licenças CI | ❌ não evidenciada |
