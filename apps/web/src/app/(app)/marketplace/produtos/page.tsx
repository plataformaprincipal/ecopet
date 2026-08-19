"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { MarketplaceCatalog } from "@/components/features/marketplace/marketplace-catalog";
import { MarketplaceGridSkeleton } from "@/components/features/marketplace/marketplace-skeleton";

export default function ProdutosPage() {
  return (
    <MarketplacePageWrapper title="Produtos">
      <Suspense fallback={<MarketplaceGridSkeleton />}>
        <MarketplaceCatalog defaultType="product" />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
