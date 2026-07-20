# Checklist LGPD — Analytics

## Nunca enviar ao Google Analytics

- CPF / RG / CNPJ
- Telefone / e-mail completo
- Senha / JWT / cookies / tokens
- Endereço completo / CEP
- Dados de cartão / PIX / conta bancária
- Dados médicos / clínicos

## Controles técnicos

| Controle | Status |
|----------|--------|
| Consent Mode v2 default denied | Implementado |
| Banner de consentimento | Implementado |
| `sanitizeEventParams` | Implementado |
| Paths admin/api excluídos de pageview | Implementado |
| Measurement ID mascarado em admin | Implementado |
| Ponte CMP externa | Contrato pronto (`applyExternalCmpConsent`) |

## Operacional (manual)

- [ ] Registrar DPO / canal de titular
- [ ] SLA de exclusão / exportação
- [ ] Revisão trimestral do catálogo de eventos
- [ ] Validar que DebugView não mostra PII
