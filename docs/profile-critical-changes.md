# Regras de alteração crítica de perfil (Etapa 4)

## PARTNER (ACTIVE)

Se o parceiro **já aprovado** alterar:

- **CNPJ**, ou
- **Razão social** (`legalName`)

A conta volta para:

- `User.accountStatus = PENDING`
- `PartnerProfile.verificationStatus = PENDING`

É necessária nova aprovação administrativa.

Demais campos (telefone, endereço, descrição, horários) podem ser editados sem reanálise.

## ONG (ACTIVE)

Se a ONG **já aprovada** alterar:

- **CNPJ**, ou
- **Nome institucional** (`ongName`)

A conta volta para:

- `User.accountStatus = PENDING`
- `OngProfile.verificationStatus = PENDING`

## CLIENT

- CPF só pode ser informado uma vez (não editável após cadastro nesta etapa).
- E-mail não é editável sem fluxo de verificação futuro.
- Endereço legado (`User.address`) e `addressRecord` são sincronizados no update.

## Auditoria

Alterações críticas geram `AuditLog` com módulo `profile.partner` ou `profile.ong`.
