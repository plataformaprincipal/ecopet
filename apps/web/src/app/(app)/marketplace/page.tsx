"use client";

import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { MarketplaceHub } from "@/components/features/marketplace/marketplace-hub";

export default function MarketplacePage() {
  return (
    <MarketplacePageWrapper title="Marketplace">
      <MarketplaceHub />
    </MarketplacePageWrapper>
  );
}
