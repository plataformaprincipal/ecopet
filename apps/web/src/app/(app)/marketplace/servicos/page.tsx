"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { MarketplaceCatalog } from "@/components/features/marketplace/marketplace-catalog";
import { MarketplaceGridSkeleton } from "@/components/features/marketplace/marketplace-skeleton";
import { ServicesExperience } from "@/components/features/marketplace/services-discovery";

export default function ServicosPage() {
  return (
    <MarketplacePageWrapper title="Serviços">
      <Suspense fallback={<MarketplaceGridSkeleton type="service" />}>
        <ServicesExperience>
          <MarketplaceCatalog defaultType="service" />
        </ServicesExperience>
      </Suspense>
    </MarketplacePageWrapper>
  );
}
