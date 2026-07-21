# Resposta a incidentes

1. Pegar `correlationId` do usuário/suporte  
2. Buscar no Better Stack Live/SQL por `correlationId`  
3. Checar `/api/health/ready` e Admin Observability  
4. Ver integração afetada (`module` / `integration`)  
5. Mitigar (flag `OBS_FLAG_*` / feature do provider)  
6. Documentar incidente externo (status page Better Stack Uptime se houver)
