# Checklist de produção — EcoPet

## Antes do deploy

- [ ] Secrets configurados na Vercel (não no código)
- [ ] `npm run type-check` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run build` ✅
- [ ] `npm run db:migrate:deploy` no banco de produção
- [ ] `npm run test:foundation:all` (staging)
- [ ] `npm run test:security` ✅
- [ ] Primeiro ADMIN via `npm run admin:bootstrap` (uma vez)
- [ ] Upload: Cloudinary ou Supabase configurado
- [ ] SMTP configurado para e-mails transacionais
- [ ] Gateway pagamento: `NOT_CONFIGURED` até credenciais (OK)

## Segurança

- [ ] `.env` não versionado
- [ ] Headers de segurança ativos
- [ ] Rate limit login ativo
- [ ] LGPD: páginas `/legal/*` publicadas
- [ ] DPO/contato privacidade definido

## Pós-deploy

- [ ] `/api/health` → database connected
- [ ] Login ADMIN + Gestor BI
- [ ] Integrações → status real na Central
- [ ] Monitorar logs 24h

## Não fazer em produção

- `UPLOAD_DEV_FALLBACK=1`
- Banco `.ecopet/pg-data` local
- Seeds com dados fictícios permanentes
