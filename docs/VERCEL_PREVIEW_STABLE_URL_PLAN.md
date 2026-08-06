# Plano de URL estável de homologação (Preview)

**Projeto Vercel:** `ecopet-s-projects/ecopet-web`  
**Produção:** `https://www.eccopet.com` — não alterar  
**Escopo:** planejamento apenas — **DNS não configurado automaticamente** nesta fase.

---

## Opções avaliadas

| Hostname | Prós | Contras |
| -------- | ---- | ------- |
| `preview.eccopet.com` | Nome alinhado a “Preview Vercel”; curto | Pode confundir com deployment URL `*.vercel.app` |
| `homolog.eccopet.com` | Semântica clara de homologação/financeiro | — |
| `staging.eccopet.com` | Convencional em engenharia | Às vezes associado a “quase produção” com dados reais |

## Recomendação

```text
homolog.eccopet.com
```

**Motivo:** deixa explícito que o ambiente é de homologação (sandbox, ledger de teste), reduz risco de operadores tratarem o host como produção, e evita ambiguidade com URLs temporárias `*.vercel.app` geradas a cada deploy.

Associar ao projeto **`ecopet-web`**, ambiente **Preview** (ou domínio custom ligado a branch de homologação / deployment Preview permanente — conforme painel Vercel).

---

## Mapeamento de variáveis (após DNS + TLS)

Todas com `https://homolog.eccopet.com` (sem trailing slash inconsistente; escolher uma convenção e manter):

| Variável | Valor pretendido |
| -------- | ---------------- |
| `APP_URL` | `https://homolog.eccopet.com` |
| `NEXT_PUBLIC_APP_URL` | `https://homolog.eccopet.com` |
| `NEXTAUTH_URL` | `https://homolog.eccopet.com` |
| `WEB_URL` | `https://homolog.eccopet.com` |

Escopo Vercel: **somente Preview** (não copiar para Production).

---

## Callbacks de autenticação

- NextAuth / login: `NEXTAUTH_URL` = host estável.
- Callbacks OAuth (se houver): autorizar `https://homolog.eccopet.com/*` nos providers.
- Cookies de sessão: host estável evita invalidar sessão a cada novo `*.vercel.app`.

Código já prioriza `VERCEL_URL` em Preview quando URLs canônicas apontam para produção (`resolvePublicAppUrl`); mesmo assim, **definir as variáveis acima no Preview** evita cookies no host errado.

---

## Webhook Mercado Pago

Após deploy Preview funcional:

```text
https://homolog.eccopet.com/api/webhooks/mercado-pago
```

(Confirmar rota oficial no código antes de cadastrar no painel MP sandbox.)

- Usar `MERCADO_PAGO_WEBHOOK_SECRET` de homologação.
- Não apontar webhook de Production para homologação e vice-versa.

---

## Riscos de URLs temporárias por deployment

| Risco | Impacto |
| ----- | ------- |
| URL `https://<hash>-ecopet-web.vercel.app` muda a cada deploy | Quebra `NEXTAUTH_URL`, cookies, links de e-mail |
| Webhook MP cadastrado na URL antiga | Eventos não chegam / 404 |
| APP_URL compartilhado com Production | Sessão/cookies no host errado |
| E2E com WEB_URL volátil | Testes frágeis e não reproduzíveis |

**Mitigação:** domínio estável `homolog.eccopet.com` + variáveis Preview alinhadas + webhook sandbox nesse host.

---

## Passos manuais (responsável DNS / Vercel)

```text
[ ] Criar registro DNS (CNAME/ALIAS) para homolog.eccopet.com → Vercel
[ ] Adicionar domínio no projeto ecopet-web (Preview / branch de homologação)
[ ] Aguardar certificado TLS
[ ] Atualizar APP_URL, NEXT_PUBLIC_APP_URL, NEXTAUTH_URL, WEB_URL só no Preview
[ ] Validar com scripts/check-preview-environment.mjs
[ ] Só então: migrate homolog + deploy + webhook MP sandbox
```

Não executar estes passos automaticamente nesta preparação documental.
