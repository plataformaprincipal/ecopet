"use client";

import { useParams } from "next/navigation";
import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { ServiceDetailContent } from "@/components/marketplace/service-detail-content";

export default function ServicoPage() {
  const { id } = useParams();
  return (
    <MarketplacePageWrapper title="Serviço" className="mx-auto max-w-6xl flex-1 p-4 lg:p-8">
      <ServiceDetailContent id={id as string} />
    </MarketplacePageWrapper>
  );
}
