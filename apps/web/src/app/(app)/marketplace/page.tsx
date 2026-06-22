import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { PublicMarketplacePage } from "@/components/features/public-client/pages/public-marketplace-page";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { MarketplaceHub } from "@/components/features/marketplace/marketplace-hub";

export default async function MarketplacePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <PublicMarketplacePage />;
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
