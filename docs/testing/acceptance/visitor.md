# Roteiro manual — VISITOR

| ID | Cenário | Passos | Esperado | Obtido | Status |
|---|---|---|---|---|---|
| V-01 | Home | Abrir `/` | Carrega | | |
| V-02 | Marketplace | `/marketplace/produtos` | Lista/vazio | | |
| V-03 | Explorar | `/explorar` | Carrega | | |
| V-04 | Login | `/login` | Form | | |
| V-05 | Cadastro | `/cadastro` | Form | | |
| V-06 | Recuperar senha | `/recuperar-senha` | Form | | |
| V-07 | Admin direto | `/admin` | Redirect login | | |
| V-08 | API /me | GET sem cookie | 401 | | |
| V-09 | i18n | Trocar idioma | UI traduz | | |
| V-10 | A11y teclado | Tab no login | Foco visível | | |
| V-11 | VLibras | Abrir widget | Disponível | | |
| V-12 | Turnstile | Cadastro público | Widget se enabled | | |

Automação: `e2e/acceptance/visitor.spec.ts`
