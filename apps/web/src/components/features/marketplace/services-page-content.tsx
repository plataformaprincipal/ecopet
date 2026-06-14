"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "./service-card";
import { EmptyState } from "./empty-state";
import { MarketplaceGridSkeleton } from "./marketplace-skeleton";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { fetchServices } from "@/lib/marketplace/api";
import { SERVICE_CATEGORIES } from "@/lib/marketplace/config";
import type { MarketplaceService } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

export function ServicesPageContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat") ?? "";
  const { setSearchPanelOpen, filters } = useMarketplaceStore();
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(catParam);

  useEffect(() => {
    fetchServices().then(setServices).finally(() => setLoading(false));
  }, []);

  let filtered = services;
  if (category) filtered = filtered.filter((s) => s.category === category);
  if (filters.homeService) filtered = filtered.filter((s) => s.homeService);
  if (filters.verifiedOnly) filtered = filtered.filter((s) => s.partner.isVerified);
  if (filters.priceMin) filtered = filtered.filter((s) => s.price >= filters.priceMin);
  if (filters.priceMax) filtered = filtered.filter((s) => s.price <= filters.priceMax);

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
          {SERVICE_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", category === c.slug ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setSearchPanelOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" /> Filtros
        </Button>
      </div>

      {loading ? (
        <MarketplaceGridSkeleton type="service" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="Nenhum serviço encontrado" description="Tente alterar os filtros ou categoria." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => <ServiceCard key={s.id} service={s} />)}
        </div>
      )}
    </div>
  );
}
