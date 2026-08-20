# Catálogo oficial BR-2026.08-v1

Fonte: Relatório Mestre Financeiro — `Planejamento Financeiro e Orçamentário`.
Runtime: `apps/web/src/lib/pricing/catalog-*.ts` → seed → banco.

Contagens: MKT 27 · SRV 24 · SAU 57 · ONE 10 · PRO 10 · AI 33 · ADS 19 · PRT 10 · IOT 10 · API 4 · **Total 204**.

## Market (SELLER_DEFINED)

Tickets de referência. Preço varejista = seller.

MKT-001 Ração seca R$ 180 · MKT-002 Alimento úmido R$ 55 · MKT-003 Alimentação natural R$ 160 · MKT-004 Snacks R$ 45 · MKT-005 Suplementos R$ 95 · MKT-006 Medicamentos R$ 120 · MKT-007 Produtos veterinários R$ 90 · MKT-008 Antiparasitários R$ 85 · MKT-009 Higiene R$ 55 · MKT-010 Grooming R$ 65 · MKT-011 Acessórios R$ 75 · MKT-012 Camas R$ 180 · MKT-013 Comedouros R$ 95 · MKT-014 Fontes R$ 220 · MKT-015 Brinquedos R$ 55 · MKT-016 Mobilidade R$ 140 · MKT-017 Viagem R$ 220 · MKT-018 Rastreadores R$ 450 · MKT-019 IoT R$ 700 · MKT-020 Aves R$ 80 · MKT-021 Peixes R$ 90 · MKT-022 Répteis R$ 120 · MKT-023 Pequenos mamíferos R$ 100 · MKT-024 Fabricante R$ 150 · MKT-025 Distribuidor R$ 130 · MKT-026 Afiliado R$ 110 · MKT-027 Dropshipping R$ 140.

Regra: **10% + R$ 1,49**.

## Services (PROVIDER_DEFINED, referências)

SRV-001 Banho tutor R$ 74,90 base R$ 70 · SRV-002 Tosa R$ 99,90 / 95 · SRV-003 Grooming móvel R$ 159,90 / 155 · SRV-004 Creche R$ 89,90 / 85 · SRV-005 Hotel R$ 129,90 / 125 · SRV-006 Pet sitting R$ 69,90 / 65 · SRV-007 Hospedagem domiciliar R$ 119,90 / 115 · SRV-008 Passeio R$ 54,90 / 50 · SRV-009 Adestramento R$ 169,90 / 165 · SRV-010 Consulta comportamental R$ 249,90 / 245 · SRV-011 Táxi pet R$ 84,90 / 80 · SRV-012 Ambulância R$ 264,90 / 245,10 (+urgente) · SRV-013 Traslado nacional R$ 949,90 / 945 · SRV-014 Documentação internacional R$ 1.349,90 / 1.345 · SRV-015 Microchipagem R$ 139,90 / 135 · SRV-016 Relocation R$ 1.849,90 / 1.845 · SRV-017 Lar temporário R$ 69,90 / 65 · SRV-018 Adoção assistida R$ 189,90 / 185 · SRV-019 Cremação R$ 679,90 / 675 · SRV-020 Memorial digital R$ 79,90 / 75 · SRV-021 Paliativos domiciliares R$ 399,90 / 395 · SRV-022 Home care vet R$ 269,90 / 265 · SRV-023 Assistência logística R$ 149,90 / 130,10 (+urgente) · SRV-024 Busca local R$ 99,90 / 80,10 (+urgente).

Regra: **12% + R$ 4,90**. Urgente **+ R$ 14,90** só se elegível.

## Health (PROVIDER_DEFINED, autonomia clínica)

SAU-001…SAU-057 com piloto JP, base nacional e faixa. Cirurgia/anestesia/UTI/exames complexos = referência, não preço final garantido.

## One (FEATURE_FLAGGED — sem billing)

ONE-000 Free R$ 0 · ONE-001 Plus R$ 19,90 / 199 ano · ONE-002 Care R$ 39,90 / 399 · ONE-003 Family R$ 69,90 / 699 · ONE-004 Global R$ 99,90 / 999 · ONE-010 IA R$ 14,90 · ONE-011 Emergência digital R$ 9,90 · ONE-012 Viagem R$ 19,90 · ONE-013 Connect R$ 19,90 · ONE-014 Armazenamento R$ 5,90.

## Pro (FEATURE_FLAGGED onde o módulo não existe)

PRO-001 Starter R$ 89,90 setup 249 · PRO-002 Growth R$ 229,90 setup 499 · PRO-003 Clinic R$ 399,90 setup 899 · PRO-004 Enterprise R$ 1.499,90 setup 3.500 · PRO-010 usuário +19,90 · PRO-011 unidade +119,90 · PRO-012 suporte 179,90 · PRO-013 migração 899 · PRO-014 treino 349 · PRO-015 white-label 5.999.

## AI (preço catalogado; comprável só com capability)

AI-T01…T14, AI-P01…P14, AI-C01…C05. Sem backend = `DISABLED` / não comprável.

## Ads (FEATURE_FLAGGED)

ADS-001…ADS-019. Mídia Meta/Google/TikTok = pass-through, não receita.

## Protect (DISABLED / PARTNER_REQUIRED)

PRT-001…PRT-010. Prêmio não é receita EccoPet.

## Connect / API

IOT-001…010 (afiliado/FEATURE_FLAGGED). API-001…004 DISABLED até Data/API habilitado.
