# Checklist de Produção — IA EcoPet

## Evidências obrigatórias

| Item | Como validar |
|------|----------------|
| OpenAI | `OPENAI_API_KEY` + health `/admin/ai/foundation` |
| Responses API | Stream assistente + `enterpriseGenerate` |
| Function Calling | `FUNCTION_CALLING_READY.openAiToolLoop=true` + logs `AIToolExecution` |
| Prompt Firewall | Bloqueia jailbreak; eventos em `AISecurityEvent` |
| Rate limit | 429 sob abuso (IP/user/sessão/perfil/tool) |
| Build | `npm run build -w @ecopet/web` |
| Type-check | `npm run type-check -w @ecopet/web` |
| Lint | `npm run lint -w @ecopet/web` |
| Testes | `npm run test:ai:all -w @ecopet/web` |
| Dashboard | `/admin/ai` + `/admin/ai/executive` |
| Migration | `20260720020000_*` + `20260720030000_*` aplicadas |

## Integrações EcoPet (não quebradas)

Marketplace, Meu Pet, Agenda, Parceiros, ONGs, Social, Carrinho, Pedidos, Cloudinary, Firebase, Maps, Mercado Pago, GA/GTM, TalkJS, Resend — regras de negócio intocadas.

## Ressalvas aceitas em produção

- APM externo (Sentry/OTel) — abstração apenas
- Filas BullMQ/Trigger — bridge `AIJob` apenas
- RAG/vetorial — preparado, off por default
- E2E browser Playwright — ausente; há pipeline integração AI
