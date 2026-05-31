"use client";

import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { CartPageContent } from "@/components/marketplace/cart-page-content";

export default function CarrinhoPage() {
  return (
    <MarketplacePageWrapper title="Carrinho">
      <CartPageContent />
    </MarketplacePageWrapper>
  );
}
