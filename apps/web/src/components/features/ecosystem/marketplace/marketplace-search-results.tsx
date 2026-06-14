"use client";

import { PartnerSearchCard } from "./partner-search-card";
import { PartnerProductsPreview } from "./partner-products-preview";
import { PartnerServicesPreview } from "./partner-services-preview";
import { ProductCard } from "@/components/features/marketplace/product-card";
import { ServiceCard } from "@/components/features/marketplace/service-card";
import { PartnerCard } from "@/components/features/marketplace/partner-card";
import type { PartnerSearchGroup } from "@/lib/ecosystem/types";
import type { MarketplaceProduct, MarketplaceService, MarketplacePartner } from "@/lib/marketplace/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarketplaceSearchResultsProps {
  groups: PartnerSearchGroup[];
  products: MarketplaceProduct[];
  services: MarketplaceService[];
  partners: MarketplacePartner[];
  view?: "grouped" | "products" | "services" | "partners";
}

export function MarketplaceSearchResults({
  groups,
  products,
  services,
  partners,
  view = "grouped",
}: MarketplaceSearchResultsProps) {
  if (view === "products") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    );
  }

  if (view === "services") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => <ServiceCard key={s.id} service={s} />)}
      </div>
    );
  }

  if (view === "partners") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
      </div>
    );
  }

  return (
    <Tabs defaultValue="grouped" className="space-y-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="grouped">Por parceiro ({groups.length})</TabsTrigger>
        <TabsTrigger value="all-products">Todos produtos ({products.length})</TabsTrigger>
        <TabsTrigger value="all-services">Todos serviços ({services.length})</TabsTrigger>
        <TabsTrigger value="all-partners">Todos parceiros ({partners.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="grouped" className="space-y-8">
        {groups.map((g) => (
          <section key={g.partner.id} className="space-y-4 rounded-[16px] border border-ecopet-gray/10 bg-white/50 p-4 dark:bg-white/[0.02] lg:p-6">
            <PartnerSearchCard partner={g.partner} productCount={g.products.length} serviceCount={g.services.length} />
            <PartnerProductsPreview products={g.products} partnerId={g.partner.id} partnerName={g.partner.tradeName} />
            <PartnerServicesPreview services={g.services} partnerId={g.partner.id} partnerName={g.partner.tradeName} />
          </section>
        ))}
      </TabsContent>

      <TabsContent value="all-products">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </TabsContent>

      <TabsContent value="all-services">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => <ServiceCard key={s.id} service={s} />)}
        </div>
      </TabsContent>

      <TabsContent value="all-partners">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
        </div>
      </TabsContent>
    </Tabs>
  );
}
