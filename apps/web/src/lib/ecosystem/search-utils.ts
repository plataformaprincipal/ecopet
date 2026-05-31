import type { MarketplacePartner, MarketplaceProduct, MarketplaceService } from "@/lib/marketplace/types";
import type { PartnerSearchGroup } from "../types";

export function groupSearchByPartner(
  partners: MarketplacePartner[],
  products: MarketplaceProduct[],
  services: MarketplaceService[]
): PartnerSearchGroup[] {
  const partnerIds = new Set([
    ...products.map((p) => p.partnerId),
    ...services.map((s) => s.partnerId),
  ]);

  return [...partnerIds]
    .map((pid) => {
      const partner = partners.find((p) => p.id === pid);
      if (!partner) return null;
      return {
        partner: {
          ...partner,
          qualityIndex: partner.qualityIndex ?? Math.round(partner.rating * 20),
          completionRate: partner.completionRate ?? 96,
          isOpen: partner.isOpen ?? true,
          specialties: partner.specialties ?? partner.categories.slice(0, 3),
          avgDeliveryDays: partner.avgDeliveryDays ?? 2,
        },
        products: products.filter((p) => p.partnerId === pid),
        services: services.filter((s) => s.partnerId === pid),
      };
    })
    .filter(Boolean) as PartnerSearchGroup[];
}
