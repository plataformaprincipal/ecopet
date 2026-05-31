"use client";

import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { CustomServiceForm } from "@/components/marketplace/custom-service-form";

export default function PersonalizadosPage() {
  return (
    <MarketplacePageWrapper title="Serviços personalizados">
      <CustomServiceForm />
    </MarketplacePageWrapper>
  );
}
