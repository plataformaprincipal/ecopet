"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { PartnerProfileHub } from "@/components/ecosystem/partner/partner-profile-hub";

function ParceiroContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const manage = searchParams.get("manage") === "1";

  return <PartnerProfileHub id={id as string} mode={manage ? "manage" : "public"} />;
}

export default function ParceiroPage() {
  return (
    <MarketplacePageWrapper title="Parceiro" className="mx-auto max-w-6xl flex-1 p-4 lg:p-8">
      <Suspense fallback={<div className="animate-pulse h-96 rounded-2xl bg-ecopet-gray/10" />}>
        <ParceiroContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
