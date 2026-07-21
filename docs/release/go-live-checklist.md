# Go-Live Checklist

- [x] Branch de auditoria criada
- [x] Checkpoint registrado
- [x] lint / type-check / build
- [x] db:generate + migrate status (DB configurado)
- [x] RBAC unit
- [x] IDOR HTTP (parcial — rate-limit pendente)
- [x] Headers locais
- [x] Overrides deps High reduzidos
- [x] vercel.json
- [x] Docs `docs/release/*`
- [ ] Autenticar Vercel CLI / Dashboard
- [ ] Env Preview importada (DB staging)
- [ ] Deploy Preview
- [ ] Smoke Preview
- [ ] Better Stack ativo + alerta
- [ ] TalkJS APP_ID + webhook
- [ ] MP sandbox smoke (sem cartão real automatizado indevido)
- [ ] Backup Production confirmado
- [ ] Env Production validada (`validate:env`)
- [ ] Deploy Production
- [ ] Smoke Production
- [ ] Webhooks apontando para domínio canônico
- [ ] Monitoramento 72h

Somente marcar Production plena quando `final-verdict.md` puder subir para **PRODUÇÃO IMPLANTADA E VALIDADA**.
