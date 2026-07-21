# Matriz de aceitação (resumo executável)

Legenda Status: **Aprovado** | **Aprovado com ressalvas** | **Reprovado** | **Bloqueado por credencial** | **Não executado** | **Não aplicável**

| Perfil | Módulo | Cenário | Pré-condição | Resultado esperado | Evidência | Status |
|---|---|---|---|---|---|---|
| VISITOR | Público | Home/marketplace/explorar | App up | 200 / UI | `visitor.spec.ts` | Ver relatório |
| VISITOR | Auth | API /me sem cookie | — | 401 | `visitor.spec.ts` | Ver relatório |
| VISITOR | Admin | /admin sem login | — | redirect/bloqueio | `visitor.spec.ts` | Ver relatório |
| CLIENT | Cadastro | register válido | Turnstile off/bypass | 201 ACTIVE | `client.spec.ts` | Ver relatório |
| CLIENT | Auth | login + me | user criado | 200 | `client.spec.ts` | Ver relatório |
| CLIENT | RBAC | admin overview | CLIENT | 403 | `client.spec.ts` | Ver relatório |
| CLIENT | Meu Pet | create + IDOR | 2 clients | 403/404 | `client.spec.ts` | Ver relatório |
| PARTNER | Cadastro | register | — | 201 | `partner-ngo.spec.ts` | Ver relatório |
| PARTNER | Produto | create / ownership | partner | 201 ou 403 PENDING | `partner-ngo.spec.ts` | Ver relatório |
| NGO | RBAC | partner orders | NGO | 403 | `partner-ngo.spec.ts` | Ver relatório |
| ADMIN | Gate | obs health | CLIENT | 403 | `admin-gates.spec.ts` | Ver relatório |
| ADMIN | Obs | health | ADMIN_TEST_* | 200 sem token | `admin-gates.spec.ts` | Opcional env |
| ALL | Pagamento Live | checkout real | Autorização | — | — | Não executado |
| ALL | TalkJS Live | webhook Live | Credencial | — | — | Bloqueado por credencial |
| ALL | Preview Vercel | smoke | Deploy | — | — | Não executado |

Cenários manuais extensos: arquivos por perfil neste diretório.
