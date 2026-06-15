# Servidor estável para testes — EcoPet

Testes foundation, security e E2E devem rodar contra um servidor **consistente**. O `next dev` pode ficar inconsistente após `npm run build` (erros webpack em `.next`).

## Rotina recomendada

### 1. Parar servidores dev

No Windows (PowerShell):

```powershell
# Encerrar processos nas portas comuns
Get-NetTCPConnection -LocalPort 3000,3001,3002 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

Ou feche manualmente terminais com `next dev` / `next start`.

### 2. Limpar `.next` (se houve build + dev misturados)

```powershell
Remove-Item -Recurse -Force apps\web\.next -ErrorAction SilentlyContinue
```

Use quando aparecer `MODULE_NOT_FOUND` em rotas API após build.

### 3. Build de produção

```bash
npm run type-check
npm run lint
npm run build
```

### 4. Subir servidor de produção local

```bash
cd apps/web
$env:PORT="3002"   # PowerShell
npm run start
```

Ou use o script automatizado:

```bash
npm run test:server:start
```

### 5. Definir `WEB_URL`

```powershell
$env:WEB_URL="http://localhost:3002"
```

### 6. Executar testes

```bash
npm run test:foundation:all
npm run test:security
npm run test:e2e
```

Ou validação completa Etapa 13:

```bash
npm run test:etapa13
```

## Script automatizado

| Script | Função |
|--------|--------|
| `npm run test:server:start` | Build + `next start` na porta 3002 (background) |
| `npm run test:server:stop` | Encerra servidor na porta 3002 |
| `npm run test:etapa13` | Sobe servidor, aguarda health, roda foundation:all + security + e2e |

## Rate limit em suites longas

O servidor de teste (`test:server:start`) define `AUTH_RATE_LIMIT_RELAXED=1` (limite alto) para suportar `test:foundation:all`.

Para validar rate limit estrito (10 tentativas), rode `test:security` com o servidor **sem** relax:

```powershell
$env:AUTH_RATE_LIMIT_RELAXED="0"
npm run test:server:start
$env:WEB_URL="http://localhost:3002"
npm run test:security
```

Ou use IPs distintos via `x-forwarded-for` (já aplicado em `test-security.mjs`).

## Verificação rápida

```bash
curl http://localhost:3002/api/health
```

Resposta esperada: `{ "success": true, "data": { "database": "connected" } }`

## Banco de dados

Os testes foundation usam PostgreSQL real com dados **temporários** (e-mails `@test.ecopet.local`). Não é seed permanente.

Antes da primeira execução no dia:

```bash
npm run sync:env
npm run db:migrate:deploy
```

## Playwright

Instalar browsers uma vez:

```bash
npx playwright install chromium
```

E2E usa `WEB_URL` — **não** inicia `next dev` quando a variável está definida.

## Portas padrão

| Porta | Uso |
|-------|-----|
| 3000 | dev padrão (evitar para suite completa após build) |
| 3002 | **recomendada** para testes estáveis |
| 4000 | API Express (legado) |

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| `register 500` / `MODULE_NOT_FOUND` | Parar dev, limpar `.next`, rebuild, `next start` |
| `ECONNREFUSED` | Servidor não subiu — verificar porta e `WEB_URL` |
| Playwright timeout no login | Confirmar labels do formulário; usar API register antes |
| `prisma generate EPERM` | Parar processos Node; rodar `npm run db:generate` |
