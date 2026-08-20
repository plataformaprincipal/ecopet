import { brl, fixedSku } from "./catalog-helpers";
import type { CatalogItem } from "./types";

const SECTION = "11. EccoPet Ads e tráfego pago";

function adsSku(
  sku: string,
  name: string,
  condition: string,
  fee: number,
  cost: number,
  mediaPassThrough = false
): CatalogItem {
  return {
    ...fixedSku({
      sku,
      name,
      suite: "ADS",
      kind: "ADS",
      amountCents: brl(fee),
      unit: condition,
      costReferenceCents: brl(cost),
      commercialAvailability: "FEATURE_FLAGGED",
      revenueRecognition: "MANAGEMENT_FEE",
      portfolioSuiteId: "ads",
      sourceSection: SECTION,
      mediaPassThrough,
    }),
    billingCycle: condition.toLowerCase().includes("mensal") ? "month" : condition.toLowerCase().includes("única") || condition.toLowerCase().includes("setup") ? "once" : undefined,
  };
}

export const ADS_CATALOG: CatalogItem[] = [
  adsSku("ADS-001", "Sponsored Listing 7 dias", "Mídia interna", 49.9, 8),
  adsSku("ADS-002", "Search Boost 30 dias", "Mídia interna", 99.9, 15),
  adsSku("ADS-003", "Brand Store — setup", "Única", 799, 350),
  adsSku("ADS-004", "Brand Store — mensal", "Mensal", 899, 260),
  adsSku("ADS-005", "Local Growth — setup", "Mídia mínima R$ 600", 349, 180, true),
  adsSku("ADS-006", "Local Growth — gestão", "Mensal; mídia separada", 599, 250, true),
  adsSku("ADS-007", "Meta Ads — setup", "Única", 399, 190, true),
  adsSku("ADS-008", "Meta Ads — gestão", "Mensal; mídia mínima R$ 1.000", 899, 350, true),
  adsSku("ADS-009", "Google Ads — setup", "Única", 499, 220, true),
  adsSku("ADS-010", "Google Ads — gestão", "Mensal; mídia mínima R$ 1.500", 999, 400, true),
  adsSku("ADS-011", "TikTok Ads — setup", "Única", 499, 220, true),
  adsSku("ADS-012", "TikTok Ads — gestão", "Mensal; mídia mínima R$ 1.500", 999, 400, true),
  adsSku("ADS-013", "Multicanal — setup", "Única", 899, 450, true),
  adsSku("ADS-014", "Multicanal — gestão", "Mensal; mídia mínima R$ 5.000", 1999, 750, true),
  adsSku("ADS-015", "Creative AI Studio", "Mensal", 249, 70),
  adsSku("ADS-016", "Vídeo curto assistido por IA", "Unidade", 179, 65),
  adsSku("ADS-017", "Copy de campanha", "Unidade", 69.9, 15),
  adsSku("ADS-018", "Landing page", "Unidade", 599, 250),
  adsSku("ADS-019", "Pacote ONG", "Mensal; mídia patrocinada separada", 149, 60, true),
];
