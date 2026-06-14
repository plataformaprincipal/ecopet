"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { ProductsPageContent } from "@/components/features/marketplace/products-page-content";
import { MarketplaceGridSkeleton } from "@/components/features/marketplace/marketplace-skeleton";

export default function ProdutosPage() {
  return (
    <MarketplacePageWrapper title="Produtos">
      <Suspense fallback={<MarketplaceGridSkeleton />}>
        <ProductsPageContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
