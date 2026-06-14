"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { ServicesPageContent } from "@/components/features/marketplace/services-page-content";
import { MarketplaceGridSkeleton } from "@/components/features/marketplace/marketplace-skeleton";

export default function ServicosPage() {
  return (
    <MarketplacePageWrapper title="Serviços">
      <Suspense fallback={<MarketplaceGridSkeleton type="service" />}>
        <ServicesPageContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
