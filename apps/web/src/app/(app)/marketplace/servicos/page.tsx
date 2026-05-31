"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { ServicesPageContent } from "@/components/marketplace/services-page-content";
import { MarketplaceGridSkeleton } from "@/components/marketplace/marketplace-skeleton";

export default function ServicosPage() {
  return (
    <MarketplacePageWrapper title="Serviços">
      <Suspense fallback={<MarketplaceGridSkeleton type="service" />}>
        <ServicesPageContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
