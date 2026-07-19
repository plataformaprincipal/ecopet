# Arquitetura de localização — EcoPet

## Fonte da verdade

1. **`Address`** (1:1 User) — endereço estruturado + coordenadas do titular
2. **`PartnerProfile` / `OngProfile`** — localização comercial/institucional (pode divergir do User)
3. **Snapshots** (`Order.shippingAddress` Json) — cópia no pedido, não fonte canônica

## Fluxo de preenchimento

```
CEP (ViaCEP) → campos texto
     ↓ opcional
Nominatim / Google Geocoding → lat/lng
     ↓ opcional
Places Autocomplete → placeId + componentes + lat/lng
     ↓ opcional
Map picker (arrastar) → atualiza lat/lng (+ reverse com confirmação)
```

## Distância

| Caso | Método |
|------|--------|
| Ordenar parceiros / raio | Haversine local |
| “Como chegar” / duração | Directions API (ou haversine + link externo se offline) |
| Entrega / admin | Haversine por padrão; rota sob demanda |

## Fallback

- Sem Google: ViaCEP + formulário manual + Nominatim (CEP)
- Sem coordenadas: filtro cidade/estado
- Sem permissão GPS: uso manual sem bloqueio

## Checklist produção

- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` na Vercel
- [ ] Restrições de domínio + APIs no GCP
- [ ] Billing Google Cloud ativo
- [ ] Teste localhost + eccopet.com
- [ ] Autocomplete preenche coordenadas
- [ ] Endereço manual salva sem Google
- [ ] Parceiro próximo / rota no mobile
- [ ] Admin diagnóstico READY
- [ ] Cliente não vê endereço residencial de outros
