# Limitações da estimativa de impostos (Fase 3)

## O que é

`taxEstimate` / lançamento `TAX_ESTIMATE` é uma **estimativa operacional** para análise interna.

**Não** é:

- cálculo fiscal definitivo;
- obrigação acessória;
- base para emissão de NF-e / NFS-e;
- substituto de contabilidade ou apuração de PIS/COFINS/ISS/ICMS/IR.

## Base utilizada

- Base: **receita da plataforma** (comissão percentual + taxa fixa do snapshot).
- **Não** se calcula imposto estimado sobre GMV.
- Percentual: `PlatformSettings.taxEstimatePercent` (default `0` até configuração).

## Status

| Campo | Significado |
| ----- | ----------- |
| taxEstimated | Valor estimado no snapshot / ledger |
| taxActual | Não preenchido automaticamente nesta fase |
| taxStatus | Metadata `ESTIMATED` no lançamento |

## Imposto da plataforma vs parceiro

| Escopo | Tratamento Fase 3 |
| ------ | ----------------- |
| Imposto da plataforma | Estimativa sobre receita EccoPet |
| Imposto do parceiro | **Fora de escopo** — responsabilidade do parceiro |

## Itens não incluídos

- Retenções na fonte
- Simples Nacional / Lucro Presumido / Real
- Créditos fiscais
- DIFAL / ST
- ISS municipal variável
- Obrigações do parceiro

## Validação necessária

Qualquer uso decisório exige **validação contábil/fiscal externa**. Até lá, apresentar sempre como estimativa.
