"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { ProductsPageContent } from "@/components/marketplace/products-page-content";
import { MarketplaceGridSkeleton } from "@/components/marketplace/marketplace-skeleton";

export default function ProdutosPage() {
  return (
    <MarketplacePageWrapper title="Produtos">
      <Suspense fallback={<MarketplaceGridSkeleton />}>
        <ProductsPageContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
