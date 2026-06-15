# LGPD — Conformidade operacional EcoPet

## Bases legais

- Execução de contrato (cadastro, marketplace, agenda)
- Legítimo interesse (segurança, auditoria)
- Consentimento (cookies não essenciais, marketing futuro)
- Obrigação legal (retenção fiscal/pedidos)

## Direitos do titular

| Direito | Implementação |
|---------|---------------|
| Acesso / portabilidade | `GET /api/account/export-data` |
| Exclusão | `POST /api/account/request-deletion` → `DataPrivacyRequest` |
| Revogação consentimento | `POST /api/account/revoke-consent` |
| Retificação | Perfil do usuário + solicitação admin |

## Páginas legais

- `/legal/privacidade`
- `/legal/termos`
- `/legal/cookies`
- `/legal/lgpd`
- `/legal/exclusao-de-conta`

## Painel admin

`/dashboard/admin/privacy-requests` — fila de solicitações com AuditLog.

## Retenção

Pedidos, AuditLog e registros fiscais podem impedir exclusão imediata. Solicitações ficam `IN_REVIEW` até resolução documentada.

## PII em logs

IP e user-agent em `AuditLog` — acesso restrito a ADMIN. Secrets redigidos via `redactSecrets()`.

## Próximos passos

- Nomear encarregado (DPO) formal
- RIPD para tratamentos de alto risco
- Auditoria WCAG formal (acessibilidade)
