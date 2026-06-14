"use client";

import { Heart, Store, Wrench, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "./product-card";
import { ServiceCard } from "./service-card";
import { PartnerCard } from "./partner-card";
import { EmptyState } from "./empty-state";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { useTranslation } from "@/providers/i18n-provider";

export function FavoritesPageContent() {
  const { t } = useTranslation();
  const { favoriteProducts, favoriteServices, favoritePartners, searchHistory, productCache, serviceCache, partnerCache } =
    useMarketplaceStore();

  const resolveProducts = [...favoriteProducts].map((id) => productCache[id]).filter(Boolean);

  const resolveServices = [...favoriteServices].map((id) => serviceCache[id]).filter(Boolean);

  const resolvePartners = [...favoritePartners].map((id) => partnerCache[id]).filter(Boolean);

  return (
    <Tabs defaultValue="products">
      <TabsList className="mb-6 flex w-full flex-wrap">
        <TabsTrigger value="products">{t("marketplace.favorites.products")} ({resolveProducts.length})</TabsTrigger>
        <TabsTrigger value="services">{t("marketplace.favorites.services")} ({resolveServices.length})</TabsTrigger>
        <TabsTrigger value="partners">{t("marketplace.favorites.partners")} ({resolvePartners.length})</TabsTrigger>
        <TabsTrigger value="searches">{t("marketplace.favorites.savedSearches")}</TabsTrigger>
      </TabsList>

      <TabsContent value="products">
        {resolveProducts.length === 0 ? (
          <EmptyState icon={Heart} title={t("marketplace.favorites.noProductsTitle")} description={t("marketplace.favorites.noProductsDesc")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resolveProducts.map((p) => p && <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="services">
        {resolveServices.length === 0 ? (
          <EmptyState icon={Wrench} title={t("marketplace.favorites.noServicesTitle")} description={t("marketplace.favorites.noServicesDesc")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resolveServices.map((s) => s && <ServiceCard key={s.id} service={s} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="partners">
        {resolvePartners.length === 0 ? (
          <EmptyState icon={Store} title={t("marketplace.favorites.noPartnersTitle")} description={t("marketplace.favorites.noPartnersDesc")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resolvePartners.map((p) => p && <PartnerCard key={p.id} partner={p} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="searches">
        {searchHistory.length === 0 ? (
          <EmptyState icon={Search} title={t("marketplace.favorites.noSearchesTitle")} description={t("marketplace.favorites.noSearchesDesc")} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((h) => (
              <a
                key={h}
                href={`/marketplace/busca?q=${encodeURIComponent(h)}`}
                className="rounded-full bg-ecopet-green/10 px-4 py-2 text-sm font-medium text-ecopet-green hover:bg-ecopet-green/20"
              >
                {h}
              </a>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
