# Pricing — fonte única de verdade

## Hierarquia documental

1. **Autoridade de lançamento:** `Planejamento Financeiro e Orçamentário.pdf` (Relatório Mestre Financeiro, agosto/2026).
2. Documentos anteriores (`Modelo de Negócio e Políticas de Monetização`, etc.) permanecem histórico/benchmark.
3. Conflito numérico → **não fazer média**. Usar o Relatório Mestre.

## Versão ativa de runtime

- Código: `BR-2026.08-v1`
- País: `BR` · Moeda: `BRL`
- Status permitido no checkout: somente `ACTIVE`
- Runtime **não lê PDF**. Catálogo TypeScript (`apps/web/src/lib/pricing/catalog-*.ts`) alimenta seed → `PricingVersion` + `PricingCatalogItem`.
- Fonte de runtime: **PricingVersion ACTIVE no banco**.
- Fallback de memória: somente testes, dev controlado (`PRICING_MEMORY_FALLBACK`) ou bootstrap. Produção é fail-closed. Ver `docs/pricing/PRICING_FALLBACK.md`.

## Pricing modes

| Modo | Uso |
| ---- | --- |
| `SELLER_DEFINED` | Marketplace. Ticket MKT é referência; `Product.price` do seller prevalece. |
| `PROVIDER_DEFINED` | Serviços e saúde. Faixa/referência SRV/SAU; prestador define o preço. |
| `ECCOPET_FIXED` | One, Pro, IA, Ads fees, API. |
| `PARTNER_PRODUCT` | Protect / IoT afiliado. Prêmio ≠ receita EccoPet. |
| `REFERENCE_ONLY` | Item de planejamento sem venda. |

## Conflict matrix (implementado)

| Item | Valor antigo (docs anteriores) | Oficial (Relatório Mestre) | Implementado |
| ---- | --- | --- | --- |
| Comissão produtos | 8,4% variável por categoria | 10% + R$ 1,49/pedido | 10% + 149 centavos |
| Comissão serviços | 13% (e tabelas por categoria) | 12% + R$ 4,90/agendamento | 12% + 490 centavos |
| One Plus | R$ 16,90 em versões anteriores | R$ 19,90 / R$ 199 ano | 1990 / 19900 centavos |
| Pro entrada | estruturas antigas distintas | Starter R$ 89,90 setup R$ 249 | PRO-001 |
| Reserva | 2% provisório no código Fase 3 | 1,5% GMV | 150 bps |
| Provisão tributária | 0% no código | 12% sobre receita própria (planejamento) | 1200 bps, rótulo Estimativa |
| PSP | 2,5% no código | premissa 3% + R$ 0,49 | Estimativa; não é taxa contratual MP |

## Portfólio ≠ preço

Preço catalogado **não** torna o SKU comprável. Cruzar `commercialAvailability` + `ECCOPET_PORTFOLIO` + feature flag + parceiro verificado.
