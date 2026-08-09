# FASE 6 — Bug backlog pós-piloto (pré-piloto)

Prioridade por **RISCO = probabilidade × impacto**, não por facilidade.

| ID | Sev | Impacto | Freq | Risco | Custo pot. | Correção | Teste | Dep | Est. | Status |
| -- | --- | ------- | ---- | ----- | ---------- | -------- | ----- | --- | ---- | ------ |
| BUG-SIG-SECRET | P0 | PAID nunca via canal natural | alta | crítico | perda de confirmação / suporte | alinhar secret painel↔Preview | natural watch | painel MP | ops | ABERTO |
| BUG-PROD-MP-ENV | P0 | Production não pode cobrar com segurança | alta | crítico | go-live quebrado ou TEST em prod | env Production completo + validator READY | `check:production-env` | auth humana | ops | ABERTO |
| BUG-URL-SHARE | P1 | homolog URL/secrets em prod | média | alto | sessões/cookies errados | separar APP_URL/NEXTAUTH/auth Preview vs Prod | compare env fingerprints | Vercel | M | ABERTO |
| BUG-BACKUP-DRILL | P1 | RTO desconhecido | média | alto | perda dados | restore isolado | checklist | Supabase | M | ABERTO |
| BUG-RECON-COMMIT | P1 | fix recon só no WT | alta | médio | drift deploy | commit + deploy Preview após prova | test:finance | git | S | ABERTO |
| BUG-BYPASS-URL | P1 | vazamento bypass | baixa | médio | acesso Preview | rotacionar; redesign URL | probes | Sec | M | ABERTO |
| BUG-FLOAT-ORDER | P2 | 1¢ drift | baixa | baixo | mismatch | migração Decimal/cents | money tests | schema | L | DOC |
| BUG-NO-CHECKOUT-KILL | P2 | sem kill checkout dedicado | média | médio | mitigação lenta | flag CHECKOUT_ENABLED | unit | eng | M | ABERTO |
| BUG-ALERT-WIRING | P2 | alertas só em papel | média | médio | MTTD alto | ligar Better Stack rules | drill alerta | SRE | M | ABERTO |
| BUG-E2E-DIRTY-TREE | P3 | regressão não re-rodada completa | — | baixo | falsa confiança | limpar WT + CI | full suite | — | S | ABERTO |
