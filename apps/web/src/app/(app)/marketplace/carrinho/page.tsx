"use client";

import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { CartPageContent } from "@/components/features/marketplace/cart-page-content";

export default function CarrinhoPage() {
  return (
    <MarketplacePageWrapper title="Carrinho">
      <CartPageContent />
    </MarketplacePageWrapper>
  );
}
