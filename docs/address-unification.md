# Endereço — plano de unificação

## Estado atual (fundação)

| Campo | Tipo | Uso |
|-------|------|-----|
| `User.address` | `String?` | MVP web — cadastro/perfil simplificado |
| `User.city`, `state`, `zipCode` | `String?` | MVP web — inline |
| `User.addressRecord` | relação `Address` | API Express — endereço estruturado |

## Regra nesta etapa

- **Cadastro web (CLIENT/PARTNER/ONG):** usa campos string em `User` e perfis.
- **Cadastro API (TUTOR, etc.):** usa `addressRecord: { create }` com modelo `Address`.
- **Não remover** nenhum dos dois nesta fase.

## Próxima etapa (futuro)

1. Migrar formulários web para `Address` via `addressRecord`.
2. Deprecar `User.address` string com migration de dados.
3. Manter um único serviço `addressService` em `@ecopet/database`.
