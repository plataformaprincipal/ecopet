"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { SearchPageContent } from "@/components/marketplace/search-page-content";
import { MarketplaceGridSkeleton } from "@/components/marketplace/marketplace-skeleton";

export default function BuscaPage() {
  return (
    <MarketplacePageWrapper title="Busca">
      <Suspense fallback={<MarketplaceGridSkeleton />}>
        <SearchPageContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
