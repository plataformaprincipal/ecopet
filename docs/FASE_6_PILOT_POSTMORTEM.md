# FASE 6 — Postmortem do piloto

**Tipo:** postmortem de **não-abertura** (piloto real não executado).  
Sem busca de culpados.

## O que funcionou

- Cobrança sandbox Orders (`accredited`).  
- Entrega natural de webhook (~2s).  
- Fail-closed de assinatura (não processa sem HMAC).  
- Hardening financeiro interno (idempotência, refund sum, E2E Fase 3).  
- Inventário Production e validator de env.  
- Documentação de alertas, kill switches, runbooks.

## O que falhou

- Autenticidade HMAC do webhook (secret painel).  
- Abertura do piloto real e dry-run operacional.  
- Credenciais MP Production incompletas.  
- Backup restore drill.  
- Commit/consolidação dos patches no Git.

## Incidentes / impacto

- INC-SIG-001: zero PAID via canal oficial natural → **piloto bloqueado**.  
- Impacto financeiro real: R$0 (não aberto) — impacto estratégico: atraso de aprendizado real.

## Causas

- Configuração de secret (não bug de manifest após auditoria SDK).  
- Gates corretamente rígidos impediram “piloto cosmética”.

## Correções

- Diagnostics sanitizados + variantes manifest + testes.  
- Recon provider-aware (WT).  
- Docs Fases 4–6.

## Não repetir

- Tratar env pull `[SENSITIVE]` como secret real.  
- Abrir piloto sem webhook natural assinado.  
- Escala sem unit economics observados.

## Manter

- Fail-closed assinatura.  
- Limites conservadores.  
- Payout manual no início.

## Decisões

1. Fase 6 = consolidação de evidência + backlog, **não** growth.  
2. Fase 7 **bloqueada** até P0 fechados + piloto real mínimo reconciliado.
