# Production / Homolog Checklist — EcoPet

**Regra:** este documento **não** autoriza deploy. Smoke em produção só com aprovação explícita e janela controlada.

## A. Pré-Homologação (obrigatório)

- [x] Lint local OK  
- [x] Type-check local OK  
- [x] E2E acceptance local OK (38 passed / 1 skip)  
- [x] Unit críticos OK (auth, MP, TalkJS unit, Turnstile, a11y i18n, permissions)  
- [ ] Preview/Staging deployado  
- [ ] Env Homolog completo (ver seção C)  
- [ ] SMTP/Resend validado (sem 535)  
- [ ] Turnstile Homolog com hostnames corretos  
- [ ] `AUTH_RATE_LIMIT_*` seguros (sem relax em prod)  

## B. Smoke Homolog (sem alterar produção)

| # | Fluxo | Critério de aceite | Status |
|---|-------|--------------------|--------|
| 1 | `/` landing | Hero + CTAs + módulos | Pendente |
| 2 | Cadastro CLIENT | Conta + e-mail | Pendente |
| 3 | Cadastro PARTNER | Conta | Pendente |
| 4 | Cadastro NGO | Conta | Pendente |
| 5 | Login / logout | Sessão cookie | Pendente |
| 6 | Meu Pet CRUD | Persistência | Pendente |
| 7 | Marketplace + carrinho | Item no cart | Pendente |
| 8 | Checkout MP **test** | Preferência criada | Pendente |
| 9 | TalkJS inbox | Mensagem sandbox | Pendente |
| 10 | EcoPet IA (AI on) | Reply real | Pendente |
| 11 | Social feed | Post/comentário | Pendente |
| 12 | Admin aprovação | Gate + ação | Pendente |
| 13 | Observability | Evento Better Stack | Pendente |
| 14 | VLibras + i18n | pt/en/es | Pendente |
| 15 | Mobile 375 / 390 | Sem overflow | Pendente |
| 16 | Health live/ready | 200 | Pendente |

## C. Env Homolog (presença — nunca commitar secrets)

| Variável / grupo | Homolog |
|------------------|---------|
| DATABASE_URL / DIRECT_URL | Obrigatório |
| NEXTAUTH_URL / APP_URL | URL Preview |
| Turnstile site+secret | Obrigatório |
| TalkJS APP_ID + SECRET + MODE | Obrigatório |
| Mercado Pago test + webhook secret | Obrigatório para pagamentos |
| PAYMENT_PROVIDER | `mercado_pago` (Homolog) |
| OpenAI + AI_ENABLED | Conforme plano |
| Firebase public + admin | Push |
| Cloudinary | Upload |
| Resend ou SMTP válido | E-mail |
| Better Stack token+host | Observabilidade |
| GA / GTM | Consent LGPD |
| Maps | Geocode |

## D. Produção (somente após Homolog assinada)

- [ ] `validate:env` produção sem flags perigosas  
- [ ] Webhooks MP/TalkJS fail-closed com secrets  
- [ ] Rate limit auth estrito  
- [ ] Backup/restore testado  
- [ ] Smoke pós-deploy somente leitura + 1 fluxo crítico  
- [ ] Rollback plan documentado  

## E. Veredito atual

| Etapa | Status |
|-------|--------|
| Local Enterprise QA | ✅ Pronto para Homologação |
| Homologação | ⏳ Pendente |
| Produção | ❌ Não aprovado |
