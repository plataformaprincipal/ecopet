"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { FavoritesPageContent } from "@/components/marketplace/favorites-page-content";

export default function FavoritosPage() {
  return (
    <MarketplacePageWrapper title="Favoritos">
      <Suspense>
        <FavoritesPageContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
