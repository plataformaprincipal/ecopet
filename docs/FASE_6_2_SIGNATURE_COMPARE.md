# FASE 6.2 — Reavaliação application_id / simulador × natural

**Modo:** somente leitura  
**Sem** alteração de env, secret, credenciais, redeploy, Order, Production ou commit.

---

## Identidade confirmada pelo usuário (fonte de verdade)

| Campo | Valor |
| --- | --- |
| Credenciais TEST no painel | `application_id=2558117866767882`, `user_id=3549381009` |
| Webhook natural persistido | `application_id=2558117866767882`, `user_id=3549381009` |
| Simulador que validou HMAC | `application_id=3863741237237502`, `user_id=652366957` |

```text
CREDENTIAL TEST ↔ NATURAL = MATCH
SIMULATOR BODY ↔ NATURAL = NÃO MATCH
```

---

## Origem de `3863741237237502` / `652366957`

| Achado | Evidência |
| --- | --- |
| Vieram do **body persistido** do webhook do simulador | `MpWebhookEvent` `resourceId=123456` @ `2026-08-09T05:39:35.565Z` |
| **Não** são os IDs demo da documentação oficial | Docs usam `application_id=76506430185983`, `user_id=2025701502` |
| Coincidem com uma conta/app de teste **real distinta** vista em probe local antigo | Token local `APP_USR-3863…` → `/users/me` = `652366957` (leitura prévia; **não** prova o runtime Preview) |
| `live_mode=true` no simulador | Docs do simulador exemplificam `live_mode=false` |
| `data.id` do simulador | `123456` (Data ID digitado no painel), não `ORD…` |

**Interpretação:** esses IDs **não** são a app TEST canônica `2558…`. São (a) identidade de **outra app/conta de teste** da qual o “Simulate” pode ter sido disparado, e/ou (b) campos de body **não confiáveis** como prova de app (a doc oficial já publica `application_id`/`user_id` demonstrativos no exemplo do simulador). O HMAC do simulador prova o **secret usado para assinar aquele POST**, não que o `application_id` do body seja a app canônica.

---

## Simulador oficial: body real vs demo?

Documentação Mercado Pago (Orders → notifications → “Simulate receiving the notification”) mostra payload de exemplo com:

- `application_id: "76506430185983"`
- `user_id: 2025701502`
- `id: "123456"`
- `data.id: "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3"`

Conclusão documental: o simulador **pode e costuma** usar campos de body **demonstrativos**. Nosso evento persistido **não** copia esses demos literais; usa `3863…` / `6523…` — compatível com simulação disparada no contexto de **outra aplicação real** da conta, não com a app TEST `2558…`.

**Payload painel (docs) vs persistido (nosso DB):**

| Campo | Exemplo docs simulador | Persistido (nosso simulador) | Persistido (natural) |
| --- | --- | --- | --- |
| application_id | `76506430185983` (demo) | `3863741237237502` | `2558117866767882` |
| user_id | `2025701502` (demo) | `652366957` | `3549381009` |
| live_mode | `false` | `true` | `false` |
| id / Data ID | `123456` | `123456` | n/a ( Ord real ) |
| data.id | `ORD01…` exemplo | `123456` | `ORDTST01…A1MH` |
| type/action | order / … | order / order.processed | order / order.processed |

---

## Auditoria app `2558117866767882` (somente evidência já coletada)

| Pergunta | Resposta | Base |
| --- | --- | --- |
| Credencial runtime cria Order nessa app? | **SIM** (inferido) | Webhook natural da Order traz `application_id=2558117866767882` |
| Webhook natural retorna essa application_id? | **SIM** | `MpWebhookEvent` natural |
| user_id natural = `3549381009`? | **SIM** | idem |
| URL webhook configurada nessa aplicação? | **SIM** (inferido) | Entrega natural chegou em `homolog.eccopet.com` |
| Evento Order habilitado? | **SIM** | `type=order`, `action=order.processed` recebido |

Não foi feito pull novo de env / painel nesta reavaliação (proibido alterar/reconsultar credenciais).

---

## Docs/SDK: simulador vs natural / Orders signature

| Tópico | O que a doc/SDK diz | O que observamos |
| --- | --- | --- |
| Manifest | `id:<data.id query>;request-id:<x-request-id>;ts:<ts>;` (omitir ausentes) | Implementação alinhada; candidatos SDK_ORIGINAL + lowercase |
| data.id | Query `data.id`; Orders alfanumérico; docs antigas pedem lowercase; SDK 3.3.0 preserva case | Natural: `QUERY_DATA_DOT_ID`, len=32, upper; lowercase também tentado → ambos falharam |
| Simulador vs natural | Simulador testa URL/recebimento; exemplos usam body demo | Simulador: HMAC OK com `data.id=123456`; Natural: mismatch com `ORDTST…` |
| `data.external_reference` | Não entra no manifest SDK | Presente só no natural; **não** deve integrar HMAC |
| x-request-id / ts | Obrigatórios no fluxo assinado | Presentes no natural (`reqSha8`, `ts` persistidos) |

---

## ROOT_CAUSE_REASSESSMENT

### A) O que é comprovado

1. App TEST canônica (usuário) = `2558117866767882` / `3549381009`.
2. Webhook **natural** da Order sandbox usa exatamente essa identidade.
3. Simulador que passou HMAC trouxe body `3863741237237502` / `652366957` — **diferente** da app canônica e **diferente** do demo documental `7650…` / `2025…`.
4. Parsing do natural está correto: query `data.id` = Order real, `dataIdSrc=QUERY_DATA_DOT_ID`.
5. Mesmo `secretSha8=9d2804a9` no runtime: validou simulador e rejeitou natural.
6. `data.external_reference` no natural não explica mismatch por si só (fora do manifest).

### B) Premissa incorreta (corrigida)

```text
INCORRETO: “NATURAL_ORDER_CREATED_UNDER_DIFFERENT_APPLICATION”
            porque application_id do simulador ≠ natural.
```

O natural **está** na app TEST correta. O simulador **não** é prova confiável da identidade da app canônica.

### C) Origem de `3863741237237502`

Body do POST do **simulador oficial** persistido no DB (`123456`). Não é o demo da doc (`7650…`). Coincide com outra app/conta de teste (`652366957`) vista em probe local antigo — **não** com a app TEST `2558…`.

### D) Identidade real da app da Order

`2558117866767882` (user `3549381009`, `live_mode=false`).

### E) Identidade real do webhook natural

Mesma: `2558117866767882` / `3549381009` / `order` / `order.processed`.

### F) Evidência concreta de secret errado?

**Não há evidência nova que prove secret errado para a app `2558…`.**

- Há evidência de que `secretSha8=9d2804a9` valida o POST do **simulador** (possivelmente assinado no contexto da app/`secret` usados naquele Simulate).
- Há evidência de que o **mesmo fingerprint** não valida o natural da app `2558…`.
- Isso **não** autoriza, sozinho, concluir “troque o secret de novo” — especialmente com a confirmação do usuário de que Access Token / Public Key / Webhook Secret da app `2558…` já estão configurados.

### G) Hipótese técnica mais provável agora

```text
HIPÓTESE PRINCIPAL:
MERCADO_PAGO_NATURAL_SIGNATURE_INCONSISTENCY
(ou divergência de assinatura natural Orders ORDTST… vs simulador numérico),
com application_id do simulador NÃO usável como identidade da app.

HIPÓTESE SECUNDÁRIA (ainda aberta, sem prova final):
o “Simulate” que validou HMAC foi disparado no contexto da app 3863…
(assinado com secret dessa app), enquanto Orders/naturais vêm da 2558…
— isso só se confirma com um novo Simulate explícito NA app 2558…
sem alterar configuração.
```

### H) Próxima prova mínima (sem alterar configuração)

1. No painel da app **`2558117866767882` apenas**, disparar **um** Simulate Order.
2. Observar o `application_id` / `user_id` / `live_mode` **persistidos** e `signatureValid`.
3. Interpretar:
   - Se body vier `2558…` e `signatureValid=true` → secret runtime casa com app canônica; mismatch natural permanece inconsistência MP/canonicalização Orders.
   - Se body vier `3863…` ou demo `7650…` com `signatureValid=true` → body do simulador é não-identitário; secret ainda pode estar ok; natural continua o problema real.
   - Se `signatureValid=false` na app `2558…` → aí sim há evidência nova sobre secret/runtime **dessa** app (ainda sem “trocar às cegas”).

**Não** criar Order nova até essa prova de Simulate na app correta.  
**Não** propor reset de secret sem esse resultado.

---

## Veredito atualizado

```text
ROOT_CAUSE_REASSESSMENT:
Premissa “app natural errada” RETIRADA.
App real da Order/webhook natural = 2558117866767882.
IDs 3863…/6523… = body do simulador (outra app ou não-identitário), não a app TEST canônica.
Secret errado: NÃO comprovado para 2558….
Próximo: Simulate somente leitura na app 2558… (sem mudar config).
```

---

## Atualização — prova humana na app canônica (2026-08-09)

Humano confirmou Simulate **dentro** da app `2558117866767882` / `3549381009`.  
Body do painel continua `3863…` / `6523…` / `live_mode=true` → `SIMULATOR_BODY_IDENTITY_NOT_RELIABLE`.

Captura runtime `PlatformIntegrationLog` @ `2026-08-09T06:29:14.991Z`:

| Campo | Valor |
| --- | --- |
| signatureValid | **true** |
| failureCode | nenhum (`SIGNATURE_OK`) |
| query / body data.id | `123456` |
| candidate | `SDK_ORIGINAL` |
| ts | `1786256954` |
| manifestSha8 | `14315560` |
| expectedHmacSha8 | `3030667b` |
| receivedHmacSha8 | `3030667b` |
| secretSha8 | `9d2804a9` |

```text
SIMULATOR_CANONICAL_PANEL_TEST = VALID
NATURAL_ORDER_CREATED_UNDER_DIFFERENT_APPLICATION = DESCARTADA
```

### Prova ORDTST alfanumérica no simulador (`2026-08-09T06:32:15Z`)

```text
SIMULATOR_ORDTST_ALPHANUMERIC_VALID
```

Captura: `signatureValid=true`, `candidate=SDK_ORIGINAL`, `dataIdSrc=QUERY_DATA_DOT_ID`, `data.id=ORDTST01…A1MH`, `secretSha8=9d2804a9`, `manifestSha8=2731634f`, HMAC sha8 match (`54a39d9a`).

Eliminado: secret incorreto, HMAC básico, parsing `data.id`, ORDTST/uppercase por si só.

Comparação com natural inválido (mesmo Order):

| Item | Simulador ORDTST válido | Natural inválido |
| --- | --- | --- |
| rawQueryKeys | `bypass`, `data.id`, `type` | `data.external_reference`, `data.id`, `type`, `bypass` |
| data.external_reference | ausente | **presente** |
| data.id | `ORDTST01…A1MH` | `ORDTST01…A1MH` |
| dataIdLen/case | 32 / upper | 32 / upper |
| candidate | `SDK_ORIGINAL` | `NONE` |
| secretSha8 | `9d2804a9` | `9d2804a9` |

```text
HYPOTHESIS = NATURAL_QUERY_EXTERNAL_REFERENCE_SIGNATURE_DIVERGENCE
```

Única diferença estrutural objetiva na query: natural inclui `data.external_reference`.
