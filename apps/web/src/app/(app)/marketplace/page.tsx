import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { PublicMarketplacePagePremium } from "@/components/features/public/pages/public-marketplace-page-premium";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { MarketplaceHub } from "@/components/features/marketplace/marketplace-hub";
import { Skeleton } from "@/components/ui/skeleton";

function MarketplaceFallback() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default async function MarketplacePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Suspense fallback={<MarketplaceFallback />}>
        <PublicMarketplacePagePremium />
      </Suspense>
    );
  }

  if (user.role === UserRole.CLIENT) {
    redirect("/cliente/marketplace");
  }

  return (
    <MarketplacePageWrapper title="Marketplace">
      <MarketplaceHub />
    </MarketplacePageWrapper>
  );
}
