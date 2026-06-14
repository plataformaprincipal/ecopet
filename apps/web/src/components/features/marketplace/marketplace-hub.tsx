"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Sparkles, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "./product-card";
import { ServiceCard } from "./service-card";
import { PartnerCard } from "./partner-card";
import { SmartRecommendations } from "./smart-recommendations";
import { CustomServiceForm } from "./custom-service-form";
import { MarketplaceGridSkeleton } from "./marketplace-skeleton";
import { useMarketplaceStore } from "@/store/marketplace-store";
import {
  fetchProducts,
  fetchServices,
  fetchPartners,
  fetchAiRecommendations,
} from "@/lib/marketplace/api";
import type { MarketplaceProduct, MarketplaceService, MarketplacePartner, AiRecommendation } from "@/lib/marketplace/types";
import { useTranslation } from "@/providers/i18n-provider";

const FILTER_TAG_KEYS = ["freeShipping", "verified", "promos", "nearMe"] as const;

export function MarketplaceHub() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setSearchPanelOpen, setAiModalOpen, setCartOpen, cartCount, setFilters, addSearchHistory } = useMarketplaceStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("produtos");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [partners, setPartners] = useState<MarketplacePartner[]>([]);
  const [aiRecs, setAiRecs] = useState<AiRecommendation[]>([]);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchServices(), fetchPartners(), fetchAiRecommendations()]).then(([p, s, pt, ai]) => {
      setProducts(p); setServices(s); setPartners(pt); setAiRecs(ai);
    }).finally(() => setLoading(false));
  }, []);

  function handleSearch() {
    if (query.trim()) {
      addSearchHistory(query.trim());
      setFilters({ query: query.trim() });
      router.push(`/marketplace/busca?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ecopet-gray" />
          <Input
            className="h-11 pl-10"
            placeholder={t("marketplace.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>{t("marketplace.searchButton")}</Button>
        <Button variant="outline" onClick={() => setSearchPanelOpen(true)}><SlidersHorizontal className="h-5 w-5" /></Button>
        <Button variant="outline" className="relative" onClick={() => setCartOpen(true)}>
          <ShoppingCart className="h-5 w-5" />
          {cartCount() > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ecopet-yellow text-[9px] font-bold">
              {cartCount()}
            </span>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_TAG_KEYS.map((key) => (
          <button key={key} type="button" className="rounded-full bg-ecopet-gray/10 px-3 py-1 text-xs font-medium hover:bg-ecopet-green/10">
            {t(`marketplace.filterTags.${key}`)}
          </button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setAiModalOpen(true)}><Sparkles className="h-4 w-4" /> IA</Button>
      </div>

      {aiRecs.length > 0 && <SmartRecommendations recommendations={aiRecs} />}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="produtos">{t("marketplace.tabs.products")}</TabsTrigger>
          <TabsTrigger value="servicos">{t("marketplace.tabs.services")}</TabsTrigger>
          <TabsTrigger value="personalizados">{t("marketplace.tabs.custom")}</TabsTrigger>
          <TabsTrigger value="parceiros">{t("marketplace.tabs.partners")}</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="mt-4"><MarketplaceGridSkeleton /></div>
        ) : (
          <>
            <TabsContent value="produtos" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <Link href="/marketplace/produtos" className="mt-4 block">
                <Button variant="outline" className="w-full">{t("marketplace.viewAllProducts")}</Button>
              </Link>
            </TabsContent>
            <TabsContent value="servicos" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => <ServiceCard key={s.id} service={s} />)}
              </div>
              <Link href="/marketplace/servicos" className="mt-4 block">
                <Button variant="outline" className="w-full">{t("marketplace.viewAllServices")}</Button>
              </Link>
            </TabsContent>
            <TabsContent value="personalizados" className="mt-4">
              <CustomServiceForm />
            </TabsContent>
            <TabsContent value="parceiros" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
