# QA Report — EcoPet Enterprise

**Escopo:** Validação pós Etapa 1 (Foundation) + Etapa 2 (UI Premium)  
**Método:** Playwright acceptance + unit suites + auditoria de env (sem secrets) + análise estática  
**Veredito:** ✅ **Pronto para Homologação** (não produção)

---

## Matriz consolidada

| Módulo | Status | Problemas | Prioridade | Correção | Arquivo / Evidência | Impacto |
|--------|--------|-----------|------------|----------|---------------------|---------|
| Landing / Hero | Aprovado | Unsplash AI image 404 (corrigido) | P2 | Trocar URL | `premium-public-home.tsx` | Visual |
| Pré-visualização módulos | Aprovado | — | — | — | visitor.spec | UX |
| Marketplace público | Aprovado | — | — | — | visitor + client | Core |
| Explorar | Aprovado | — | — | — | visitor.spec | Core |
| Social público | Aprovado | — | — | — | visitor.spec | Core |
| EcoPet IA pública | Aprovado c/ ressalvas | AI_ENABLED=false | P2 | Homolog com AI on | env + eccopet | Feature |
| Cadastro CLIENT/PARTNER/NGO | Aprovado | SMTP 535 | P2 | Credenciais SMTP/App Password | mail logs | Ops |
| Login / Logout / Sessão | Aprovado | Multi-device não E2E | P3 | Homolog | client.spec | Auth |
| Meu Pet / IDOR | Aprovado | — | — | — | client.spec | Segurança |
| Marketplace + Carrinho | Aprovado | Checkout Live não | P1 | Homolog MP | client/partner | Negócio |
| Pedidos / Pagamento Live | Não executado | PAYMENT_PROVIDER=none | P0* | Homolog Live | MP | Negócio |
| Mensagens TalkJS Live | Não executado | APP_ID missing | P1 | Config + Test/Live | TalkJS env | Mensageria |
| Notificações Firebase | Parcial | Firebase public incompleto | P1 | Completar NEXT_PUBLIC_FIREBASE_* | env | Push |
| Parceiro produto/RBAC | Aprovado | — | — | — | partner-ngo.spec | Core |
| ONG animais/campanhas E2E | Parcial | Só cadastro+RBAC | P2 | Expandir E2E | — | Cobertura |
| Admin gates | Aprovado | ADMIN real skip | P2 | Env ADMIN_E2E | admin-gates | Cobertura |
| Admin interno / Gestor | Não E2E | Sem SUPER_ADMIN | P1 | Homolog manual | — | Enterprise |
| Better Stack Live | Não | Token missing | P1 | Config homolog | observability | Ops |
| OpenAI produção | Não | Flag off | P1 | Homolog | AI | Feature |
| i18n pt/en/es | Aprovado | — | — | — | test:i18n | A11y/i18n |
| VLibras / a11y layouts | Aprovado unit | Visual Libras Homolog | P2 | Manual | test:vlibras | A11y |
| Responsivo 375 | Aprovado | Demais breakpoints manuais | P2 | Homolog | visitor.spec | UX |
| Cross-browser | Parcial | Só Chromium | P1 | Edge/FF/Safari Homolog | playwright | Compat |
| Performance Lighthouse | Não executado | — | P2 | Homolog CI | — | Perf |
| Produção smoke | Não executado | Proibido alterar prod | P0* | Checklist | production-checklist | Release |

\*P0 apenas para **go-live produção**; não bloqueia homologação.

---

## Evidências automatizadas (contagem)

| Camada | Pass | Fail | Skip |
|--------|------|------|------|
| E2E acceptance | 38 | 0 | 1 |
| Unit (soma suites deste run) | ~213 | 0 | 0 |
| Lint / type-check | OK | — | — |

---

## Riscos residuais para Homologação

1. SMTP Gmail inválido (535) — e-mails de boas-vindas/recuperação falham localmente.  
2. TalkJS incompleto (`TALKJS_APP_ID`).  
3. Firebase client incompleto.  
4. Pagamentos desligados (`PAYMENT_PROVIDER=none`).  
5. Better Stack sem token local.  
6. Cross-browser e Safari/iOS não rodados.  
7. SUPER_ADMIN / painel interno sem E2E credenciado.

---

## Recomendação

Prosseguir para **ambiente de Homologação (Preview/Staging)** com checklist de `production-checklist.md`, credenciais Live/Test corretas e smoke manual dos gaps acima.
