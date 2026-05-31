"use client";

import { Heart, Store, Wrench, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "./product-card";
import { ServiceCard } from "./service-card";
import { PartnerCard } from "./partner-card";
import { EmptyState } from "./empty-state";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_PARTNERS } from "@/lib/marketplace/mock-data";

export function FavoritesPageContent() {
  const { favoriteProducts, favoriteServices, favoritePartners, searchHistory } = useMarketplaceStore();

  const products = MOCK_PRODUCTS.filter((p) => favoriteProducts.has(p.id));
  const services = MOCK_SERVICES.filter((s) => favoriteServices.has(s.id));
  const partners = MOCK_PARTNERS.filter((p) => favoritePartners.has(p.id));

  return (
    <Tabs defaultValue="products">
      <TabsList className="mb-6 flex w-full flex-wrap">
        <TabsTrigger value="products">Produtos ({products.length})</TabsTrigger>
        <TabsTrigger value="services">Serviços ({services.length})</TabsTrigger>
        <TabsTrigger value="partners">Parceiros ({partners.length})</TabsTrigger>
        <TabsTrigger value="searches">Buscas salvas</TabsTrigger>
      </TabsList>

      <TabsContent value="products">
        {products.length === 0 ? (
          <EmptyState icon={Heart} title="Nenhum produto favorito" description="Toque no coração nos cards para salvar." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="services">
        {services.length === 0 ? (
          <EmptyState icon={Wrench} title="Nenhum serviço favorito" description="Favorite serviços para acessar rapidamente." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="partners">
        {partners.length === 0 ? (
          <EmptyState icon={Store} title="Nenhum parceiro favorito" description="Siga parceiros de confiança." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="searches">
        {searchHistory.length === 0 ? (
          <EmptyState icon={Search} title="Nenhuma busca salva" description="Suas buscas recentes aparecerão aqui." />
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
