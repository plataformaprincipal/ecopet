"use client";

import { useParams } from "next/navigation";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { ProductDetailContent } from "@/components/features/marketplace/product-detail-content";

export default function ProdutoPage() {
  const { id } = useParams();
  return (
    <MarketplacePageWrapper title="Produto" className="mx-auto max-w-6xl flex-1 p-4 lg:p-8">
      <ProductDetailContent id={id as string} />
    </MarketplacePageWrapper>
  );
}
