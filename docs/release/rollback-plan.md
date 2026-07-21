# Rollback Plan

| Gatilho | Ação | Impacto | Validação |
|---------|------|---------|-----------|
| Deploy quebrado | Vercel → Promote deployment anterior | Downtime curto | `/api/health/live` + home |
| Env incorreta | Reverter variável na Vercel + redeploy | Sessões/integrações | login smoke |
| Feature flag ruim | `AI_ENABLED=false`, `PAYMENT_PROVIDER=none`, TalkJS test | Funcionalidade parcial | health integrações |
| Webhook MP falhando | Manter fail-closed; desligar provider se fraude | Pagamentos pausados | logs webhook |
| OpenAI fora | `AI_ENABLED=false` | IA indisponível | UI fallback |
| TalkJS fora | Flag/messaging off | Chat | |
| E-mail fora | Trocar provider / Resend status | Recuperação senha | |
| Banco indisponível | Ready=503; não migrar às cegas | App degradada | Supabase status |
| Migration ruim | Restore backup (sem down automático) | Possível perda desde backup | integrity checks |
| Incidente segurança | Rotacionar `AUTH_SECRET`, tokens, invalidar sessões | Logout global | |

Responsável: Release Manager / on-call. Comunicação: status page interna + Better Stack (quando ativo).

Detalhe adicional: `docs/production/rollback.md`.
