"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Sparkles, ShoppingCart, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "./product-card";
import { ServiceCard } from "./service-card";
import { PartnerCard } from "./partner-card";
import { SmartRecommendations } from "./smart-recommendations";
import { SubscriptionCard } from "./subscription-card";
import { MarketplaceGridSkeleton } from "./marketplace-skeleton";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { HOME_CATEGORIES } from "@/lib/marketplace/config";
import { fetchProducts, fetchServices, fetchPartners, fetchAiRecommendations, fetchSubscriptions } from "@/lib/marketplace/api";
import type { MarketplaceProduct, MarketplaceService, MarketplacePartner, AiRecommendation, SubscriptionPlan } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

export function MarketplaceHome() {
  const { setSearchPanelOpen, setAiModalOpen, setCartOpen, cartCount, setFilters, addSearchHistory } = useMarketplaceStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [partners, setPartners] = useState<MarketplacePartner[]>([]);
  const [aiRecs, setAiRecs] = useState<AiRecommendation[]>([]);
  const [subs, setSubs] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    Promise.all([
      fetchProducts(),
      fetchServices(),
      fetchPartners(),
      fetchAiRecommendations(),
      fetchSubscriptions(),
    ]).then(([p, s, pt, ai, sub]) => {
      setProducts(p);
      setServices(s);
      setPartners(pt);
      setAiRecs(ai);
      setSubs(sub);
    }).finally(() => setLoading(false));
  }, []);

  function handleSearch() {
    if (query.trim()) {
      addSearchHistory(query.trim());
      setFilters({ query: query.trim() });
      window.location.href = `/marketplace/busca?q=${encodeURIComponent(query.trim())}`;
    }
  }

  const featuredProducts = products.filter((p) => p.isPromo || p.aiTag).slice(0, 4);
  const topServices = services.slice(0, 4);
  const nearbyPartners = [...partners].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Premium header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ecopet-dark via-ecopet-green to-ecopet-dark p-6 text-white lg:p-10">
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-3 bg-ecopet-yellow text-ecopet-dark">Marketplace ECOPET</Badge>
          <h1 className="font-display text-2xl font-bold lg:text-4xl">
            Tudo para o seu pet, em um só lugar
          </h1>
          <p className="mt-2 text-sm text-white/80 lg:text-base">
            Produtos, serviços, parceiros verificados e recomendações inteligentes da IA ECOPET.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setAiModalOpen(true)}>
              <Sparkles className="h-4 w-4" /> Pedir ajuda da IA
            </Button>
            <Link href="/marketplace/personalizados">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Solicitar serviço personalizado
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ecopet-yellow/20 blur-3xl" />
      </section>

      {/* Search */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Buscar no Marketplace</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ecopet-gray" />
            <Input
              className="h-12 pl-10"
              placeholder="Buscar ração, banho, veterinário, hospedagem..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button size="lg" onClick={handleSearch}>Buscar</Button>
          <Button size="lg" variant="outline" onClick={() => setSearchPanelOpen(true)}>
            <SlidersHorizontal className="h-5 w-5" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
          <Button size="lg" variant="outline" className="relative" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount() > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ecopet-yellow text-[10px] font-bold text-ecopet-dark">
                {cartCount()}
              </span>
            )}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Ração", "Banho e tosa", "Veterinário", "Frete grátis", "Verificados"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => { setQuery(tag); setFilters({ query: tag }); }}
              className="rounded-full bg-ecopet-gray/10 px-3 py-1 text-xs font-medium hover:bg-ecopet-green/10"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="mb-4 font-display text-lg font-bold">Categorias</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {HOME_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br p-4 text-center transition-transform hover:scale-105",
                cat.color
              )}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-semibold">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {loading ? (
        <MarketplaceGridSkeleton />
      ) : (
        <>
          <SmartRecommendations recommendations={aiRecs} />

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Produtos em destaque</h2>
              <Link href="/marketplace/produtos" className="text-sm font-semibold text-ecopet-green">Ver todos</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Serviços mais procurados</h2>
              <Link href="/marketplace/servicos" className="text-sm font-semibold text-ecopet-green">Ver todos</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topServices.map((s) => <ServiceCard key={s.id} service={s} />)}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-ecopet-green" />
              <h2 className="font-display text-lg font-bold">Parceiros próximos</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyPartners.map((p) => <PartnerCard key={p.id} partner={p} />)}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-red-500" />
              <h2 className="font-display text-lg font-bold">Ofertas e combos</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subs.map((s) => <SubscriptionCard key={s.id} plan={s} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
