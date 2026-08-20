# Pricing fallback classification

| Source | Class | Allowed |
| ------ | ----- | ------- |
| `NODE_ENV=test` memory catalog | test fallback | Yes — unit engine tests |
| `PRICING_MEMORY_FALLBACK=true` in non-production | dev fallback | Yes — bootstrap/admin preview |
| Non-production without flag | migration compatibility | Memory catalog may load for preview; checkout charging still prefers DB |
| Production (`VERCEL_ENV=production`) missing schema / ACTIVE version / empty catalog | production forbidden | Fail-closed `PricingError` |
| `pricing-pure.ts` / `calculateOrderPricing` | production forbidden | Tests only. Never checkout. |

Checkout and appointment booking call `resolveActivePricingVersion({ charging: true })`.

Charging never falls back to `commerce-allocation` or `pricing-pure`.
