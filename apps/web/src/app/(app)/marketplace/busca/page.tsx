"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { SearchPageContent } from "@/components/features/marketplace/search-page-content";
import { MarketplaceGridSkeleton } from "@/components/features/marketplace/marketplace-skeleton";

export default function BuscaPage() {
  return (
    <MarketplacePageWrapper title="Busca">
      <Suspense fallback={<MarketplaceGridSkeleton />}>
        <SearchPageContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
