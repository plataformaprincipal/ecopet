# Known Limitations

| Limitação | Severidade | Mitigação |
|-----------|------------|-----------|
| Deploy Vercel não executado neste ambiente | Alta (ops) | Login CLI + passos em `vercel-deployment.md` |
| `PAYMENT_PROVIDER=none` local | Alta go-live | Ativar sandbox/Live com secret |
| TalkJS APP_ID ausente | Alta chat | Configurar Test/Live |
| Better Stack ausente | Alta ops | Tokens + alertas |
| Firebase public config incompleta | Média push | Completar NEXT_PUBLIC_* |
| CSP unsafe-inline/eval | Média XSS | Aceite temporário VLibras |
| npm audit 2 High residuais | Média | Aceite formal ou bump nodemailer/firebase cadeia |
| Rate-limit HTTP suíte timeout | Média evidência | Retestar em Preview com pool saudável |
| LGPD retenção/DPO MANUAL | Média | Processo ops |
| Lighthouse/CWV não medidos nesta etapa | Baixa | Rodar em Preview |
| Safari/iOS E2E não nesta máquina | Baixa | Homologação device |
| SUPER_ADMIN E2E | Baixa | Manual |
