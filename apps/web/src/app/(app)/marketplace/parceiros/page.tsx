"use client";

import { Suspense } from "react";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { MarketplaceCatalog } from "@/components/features/marketplace/marketplace-catalog";
import { MarketplaceGridSkeleton } from "@/components/features/marketplace/marketplace-skeleton";
import { useTranslation } from "@/providers/i18n-provider";

export default function MarketplaceParceirosPage() {
  const { t } = useTranslation();
  return (
    <MarketplacePageWrapper title={t("nav.partners")} className="mx-auto max-w-6xl flex-1 p-4 lg:p-8">
      <Suspense fallback={<MarketplaceGridSkeleton count={6} />}>
        <MarketplaceCatalog defaultType="partner" />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
