# Backups — EcoPet / Supabase

## Estado atual (informado + código)

| Camada | Estado | Observação |
|--------|--------|------------|
| Backups diários Supabase Pro | **Ativos** (time) | Confirmar retenção no Dashboard |
| PITR | **Não habilitado** | Não ativar automaticamente (pago) |
| Backup local dev | `npm run db:backup:local` | `pg_dump` → `.ecopet/backups/` (gitignored) |
| “Backup” no Gestor interno | Stub | `BackupJob` metadata — **não** é dump real |

## Periodicidade recomendada

| Ambiente | Estratégia |
|----------|------------|
| Produção | Daily automático Supabase (já ativo) |
| Staging / Preview DB | Snapshot antes de migrate arriscada |
| Local | `db:backup:local` antes de experimentos destrutivos |

## Retenção

Definir com o time (ex.: 7–30 dias no Pro). Registrar aqui após confirmação no Dashboard:

- Retenção diária: _[preencher]_
- Região: `sa-east-1` (evidência pooler no projeto)

## PITR — relatório (sem habilitar)

### Vantagens

- Restore a um instante específico (ex.: 14:37) após migração ruim ou delete acidental
- RPO minutos em vez de “último backup da madrugada”

### Desvantagens / custo

- Add-on pago no Supabase
- Complexidade operacional
- Ainda exige disciplina de teste de restore

### Quando vale a pena

- Go-live com volume real de pagamentos/pedidos
- Equipe pequena sem janela longa de downtime
- Após incidentes onde o gap de 24h seria inaceitável

### Quando ativar no futuro

1. Orçamento aprovado
2. Runbook de restore atualizado
3. Drill em **projeto novo** (nunca overwrite prod)
4. Comunicação ao time

**Esta etapa NÃO habilita PITR.**

## Validação humana (obrigatória)

Dashboard Supabase → Database → Backups:

- [ ] Daily backup listado
- [ ] Retenção anotada
- [ ] PITR = off (esperado nesta fase)
