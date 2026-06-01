# Preparação para Hospedagem — Fase 3

Documento de referência para deploy em homologação. **Não configura hospedagem** — apenas lista requisitos.

---

## 1. Variáveis de ambiente

### API (`apps/api/.env`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL (prod/homolog) |
| `JWT_SECRET` | Sim | Segredo forte para tokens |
| `API_PORT` | Não | Padrão `4000` |
| `WEB_URL` | Sim | URL pública do frontend (CORS) |
| `NEXT_PUBLIC_WEB_URL` | Sim | Mesma URL para links de e-mail |
| `NODE_ENV` | Sim | `production` em homolog/prod |
| `EMAIL_PROVIDER` | Homolog | `console` \| `smtp` \| `resend` \| `sendgrid` \| `ses` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Se SMTP | Envio transacional |
| `RESEND_API_KEY`, `RESEND_FROM` | Se Resend | |
| `SENDGRID_API_KEY`, `SENDGRID_FROM` | Se SendGrid | |
| `AWS_SES_REGION`, `AWS_SES_ACCESS_KEY`, `AWS_SES_SECRET_KEY`, `AWS_SES_FROM` | Se SES | |

### Web (`apps/web/.env`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | Sim | URL da API (ex.: `https://api.homolog.ecopet.com.br`) |
| `NEXT_PUBLIC_WEB_URL` | Sim | URL do site |

---

## 2. Banco de dados

- Migrar de SQLite (dev) para **PostgreSQL** em homologação
- Comandos:
  ```bash
  npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
  npx prisma db seed
  ```
- Backup diário automatizado
- Não apagar dados existentes em migrações incrementais

---

## 3. E-mail

- Desenvolvimento: provider `console` — token/link no log (nunca em produção)
- Homologação: configurar Resend, SendGrid, SMTP ou SES
- Testar: recuperação de senha, código alteração senha, convites internos

---

## 4. Storage de arquivos

Pendente para produção:

- Fotos de pet, perfil, mídia social
- Opções: S3, Cloudinary, Azure Blob
- Variáveis futuras: `STORAGE_PROVIDER`, `STORAGE_BUCKET`, credenciais

---

## 5. Domínio e SSL

- [ ] Domínio apontando para frontend (Vercel/VM)
- [ ] Subdomínio API com SSL (Let's Encrypt ou CDN)
- [ ] Cookies seguros (`Secure`, `SameSite`)
- [ ] Redirect HTTP → HTTPS

---

## 6. Comandos de build e start

```bash
# Instalar
npm ci

# Gerar Prisma Client
npm run db:generate

# Build monorepo
npm run build

# Start API (exemplo)
npm run start -w @ecopet/api

# Start Web (exemplo)
npm run start -w @ecopet/web
```

---

## 7. Logs e observabilidade

- [ ] Logs estruturados da API (stdout + agregador)
- [ ] Rota `/health` monitorada
- [ ] Alertas para erro 5xx e falha de e-mail
- [ ] Auditoria (`auditLog`, `securityEvent`) retida conforme política

---

## 8. Segurança mínima

- [ ] `JWT_SECRET` único por ambiente
- [ ] Rate limit ativo (já configurado na API)
- [ ] Helmet + CORS restrito ao domínio web
- [ ] Senhas com bcrypt
- [ ] Bootstrap `gestorveras` desativado após Master Admin
- [ ] Apenas Gestor Véras cria usuários internos ADMIN

---

## 9. Ambiente de homologação

| Item | Recomendação |
|------|--------------|
| Banco | PostgreSQL dedicado homolog |
| E-mail | Provider sandbox ou domínio teste |
| Pagamentos | **Desligados** — aviso na UI |
| IA externa | Desligada até API key |
| Dados | Seed + dados de teste isolados |

---

## 10. Pendências antes de produção

1. Provedor de e-mail real configurado e testado
2. Storage de mídia (S3/Cloudinary)
3. Gateway de pagamento (fase financeira)
4. Push notifications (vacinas, pedidos)
5. QR Code visual para pets
6. Substituir mocks restantes (social parcial, IoT, alguns dashboards)
7. Testes E2E automatizados
8. WAF / DDoS na borda
9. Política de backup testada (restore)
10. LGPD — DPO, registro de consentimento em prod

---

## 11. Checklist pré-deploy

- [ ] `.env` preenchido (sem commit de secrets)
- [ ] `npm run build` OK no CI
- [ ] Migrations aplicadas
- [ ] Seed/bootstrap executado uma vez
- [ ] SSL válido
- [ ] CORS apontando para URL correta
- [ ] Recuperação de senha testada com e-mail real
- [ ] Checklist manual Fase 3 executado (`CHECKLIST_TESTES_FASE_3.md`)

---

**Status:** preparado para homologação técnica · integrações externas pendentes conforme seções acima.
