"use client";

import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { CustomServiceForm } from "@/components/features/marketplace/custom-service-form";

export default function PersonalizadosPage() {
  return (
    <MarketplacePageWrapper title="Serviços personalizados">
      <CustomServiceForm />
    </MarketplacePageWrapper>
  );
}
