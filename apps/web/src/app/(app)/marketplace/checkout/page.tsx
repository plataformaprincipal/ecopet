"use client";

import { MarketplacePageWrapper } from "@/components/marketplace/marketplace-page-wrapper";
import { CheckoutSteps } from "@/components/marketplace/checkout-steps";

export default function CheckoutPage() {
  return (
    <MarketplacePageWrapper title="Checkout" className="mx-auto max-w-5xl flex-1 p-4 lg:p-8">
      <CheckoutSteps />
    </MarketplacePageWrapper>
  );
}
