# Google Maps Platform — EcoPet

Integração Maps JavaScript + Places Autocomplete + Geocoding/Directions REST, sem substituir o ViaCEP.

## APIs utilizadas

| API | Uso |
|-----|-----|
| Maps JavaScript API | Mapa, marcador, carregamento sob demanda |
| Places API (Autocomplete + Details) | Sugestão de endereço (session token) |
| Geocoding API | Forward/reverse (server) |
| Directions API | Rota / duração estimada (server) |
| Haversine local | Filtros de raio e ordenação (sem custo Google) |

ViaCEP permanece o preenchimento gratuito a partir do CEP. Nominatim continua como fallback de geocode no fluxo CEP.

## Variáveis (somente nomes)

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Maps JS / Places no browser
- `GOOGLE_MAPS_API_KEY` — opcional REST no servidor (fallback da pública)
- `GOOGLE_MAPS_ENABLED` — flag opcional (`false` desliga)

## Restrições da chave (GCP)

1. Restringir por **HTTP referrers**: `localhost/*`, `eccopet.com/*`, `*.vercel.app/*`
2. Restringir APIs: Maps JavaScript, Places, Geocoding, Directions
3. Não versionar a chave; não logar

## Arquitetura

```
UI (AddressFormWithMaps)
  ├─ ViaCEP (sempre)
  ├─ Places Autocomplete (se chave pública)
  └─ Map picker + geolocalização (gesto do usuário)

Server
  ├─ POST /api/maps/geocode
  ├─ POST /api/maps/reverse-geocode
  ├─ POST /api/maps/route
  ├─ POST /api/maps/distance
  └─ GET  /api/maps/nearby   (haversine + Prisma)

Admin
  └─ /admin/integracoes/google-maps (sem chamadas pagas no open)
```

Loader: `@googlemaps/js-api-loader` — singleton, SSR-safe, sob demanda.

## Banco

- `Address`: placeId, formattedAddress, geocodedAt, geocodingSource, locationAccuracy, locationVerifiedAt
- `PartnerProfile` / `OngProfile`: latitude, longitude, placeId, formattedAddress, geocodedAt, serviceRadiusKm / publicLocationEnabled / locationApproximate
- `MapsUsageEvent`: métricas sanitizadas

Migration: `20260719180000_google_maps_location`

## Privacidade

- Endereço residencial de cliente: privado
- ONG: só se `publicLocationEnabled`; pode `locationApproximate`
- Parceiro: endereço comercial
- Logs: sem chave e sem endereço completo sensível

## Custos

- Carregamento sob demanda
- Debounce no autocomplete
- Session tokens Places
- Details só após seleção
- Nearby/ordenação com haversine (sem Google por request)
- Rate limit nas APIs server
- Diagnóstico admin sem disparar Geocoding

## Testes

```bash
npm run test:google-maps -w @ecopet/web
```

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| Mapa indisponível | Verificar `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` + restrições de domínio |
| Autocomplete vazio | Ativar Places API; checar billing GCP |
| CSP bloqueia script | Headers incluem maps.googleapis.com / maps.gstatic.com |
| Cadastro sem Google | ViaCEP + edição manual continuam funcionando |
