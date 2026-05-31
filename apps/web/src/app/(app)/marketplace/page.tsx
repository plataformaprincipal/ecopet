"use client";

import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { MarketplaceHub } from "@/components/marketplace/marketplace-hub";

export default function MarketplacePage() {
  return (
    <MarketplacePageWrapper title="Marketplace">
      <MarketplaceHub />
    </MarketplacePageWrapper>
  );
}
