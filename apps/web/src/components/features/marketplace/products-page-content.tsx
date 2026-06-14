"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";
import { EmptyState } from "./empty-state";
import { MarketplaceGridSkeleton } from "./marketplace-skeleton";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { fetchProducts } from "@/lib/marketplace/api";
import { PRODUCT_CATEGORIES } from "@/lib/marketplace/config";
import type { MarketplaceProduct } from "@/lib/marketplace/types";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductsPageContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat") ?? "";
  const subParam = searchParams.get("sub");
  const { setSearchPanelOpen, filters, setFilters } = useMarketplaceStore();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(catParam);

  useEffect(() => {
    fetchProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (subParam) setFilters({ subscription: true });
  }, [subParam, setFilters]);

  let filtered = products;
  if (category) filtered = filtered.filter((p) => p.category === category);
  if (filters.promoOnly) filtered = filtered.filter((p) => p.isPromo);
  if (filters.freeShipping) filtered = filtered.filter((p) => p.freeShipping);
  if (filters.verifiedOnly) filtered = filtered.filter((p) => p.partner.isVerified);
  if (filters.subscription) filtered = filtered.filter((p) => p.subscriptionAvailable);
  if (filters.priceMin) filtered = filtered.filter((p) => p.price >= filters.priceMin);
  if (filters.priceMax) filtered = filtered.filter((p) => p.price <= filters.priceMax);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", !category ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}
          >
            Todos
          </button>
          {PRODUCT_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", category === c.slug ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setSearchPanelOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" /> Filtros
        </Button>
      </div>

      {loading ? (
        <MarketplaceGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum produto encontrado" description="Tente alterar os filtros ou categoria." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
