import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { MarketplaceCatalog } from "@/components/features/marketplace/marketplace-catalog";
import { MarketplaceGridSkeleton } from "@/components/features/marketplace/marketplace-skeleton";

export default function MarketplacePage() {
  return (
    <MarketplacePageWrapper title="Marketplace">
      <Suspense fallback={<MarketplaceGridSkeleton />}>
        <MarketplaceCatalog />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
