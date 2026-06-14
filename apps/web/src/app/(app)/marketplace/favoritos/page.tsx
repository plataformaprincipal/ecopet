"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { FavoritesPageContent } from "@/components/features/marketplace/favorites-page-content";

export default function FavoritosPage() {
  return (
    <MarketplacePageWrapper title="Favoritos">
      <Suspense>
        <FavoritesPageContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
