# Performance — Auditoria Etapa 13

## Bundle

- Next.js 15 App Router com code splitting por rota
- Gestor BI: componentes client isolados; sem lib de gráficos pesada

## Queries Prisma

- Gestor: paginação max 100, `select` específico, `groupBy` para agregações
- Feed: cursor pagination
- Chat: mensagens paginadas

## Corrigido / OK

- Tabelas admin com paginação obrigatória
- Overview gestor usa `Promise.all` com contagens

## Pendências

- Profiling LCP em `/feed` com mídia
- Cache curto para overview gestor (opcional)
- Análise `npm run build` bundle analyzer (não executado nesta etapa)

## Regras

- Não carregar milhares de registros no client
- Evitar `include` profundo sem `take`
