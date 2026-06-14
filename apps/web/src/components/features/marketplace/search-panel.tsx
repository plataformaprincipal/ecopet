"use client";

import { useRouter } from "next/navigation";
import { X, Search, Clock, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SORT_OPTIONS, PRODUCT_CATEGORIES, SERVICE_CATEGORIES } from "@/lib/marketplace/config";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS = [
  ...PRODUCT_CATEGORIES.map((c) => ({ ...c, source: "product" as const })),
  ...SERVICE_CATEGORIES.map((c) => ({ ...c, source: "service" as const })),
];

function categoryOptionValue(source: "product" | "service", slug: string) {
  return `${source}:${slug}`;
}

function categorySelectValue(type: string, category: string) {
  if (!category) return "";
  if (type === "product" || type === "service") {
    return categoryOptionValue(type, category);
  }
  return category;
}

function categoryLabel(type: string, category: string) {
  if (!category) return "";
  const source = type === "product" || type === "service" ? type : null;
  const match = CATEGORY_OPTIONS.find((c) => c.slug === category && (!source || c.source === source));
  return match?.label ?? category;
}

export function SearchPanel() {
  const router = useRouter();
  const {
    searchPanelOpen,
    setSearchPanelOpen,
    filters,
    setFilters,
    resetFilters,
    searchHistory,
    addSearchHistory,
  } = useMarketplaceStore();

  const activeTags = [
    filters.type && { key: "type", label: filters.type },
    filters.category && { key: "category", label: categoryLabel(filters.type, filters.category) },
    filters.verifiedOnly && { key: "verifiedOnly", label: "Verificado" },
    filters.promoOnly && { key: "promoOnly", label: "Promoção" },
    filters.freeShipping && { key: "freeShipping", label: "Frete grátis" },
    filters.homeService && { key: "homeService", label: "Domicílio" },
    filters.minRating > 0 && { key: "minRating", label: `${filters.minRating}+ estrelas` },
  ].filter(Boolean) as { key: string; label: string }[];

  function handleSearch() {
    if (filters.query.trim()) addSearchHistory(filters.query.trim());
    setSearchPanelOpen(false);
    router.push(`/marketplace/busca?q=${encodeURIComponent(filters.query)}`);
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity lg:bg-black/30",
          searchPanelOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSearchPanelOpen(false)}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 dark:bg-[#0f1419] lg:max-w-lg",
          searchPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ecopet-gray/10 bg-white px-4 py-4 dark:bg-[#0f1419]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-ecopet-green" />
            <h2 className="font-display text-lg font-bold">Busca avançada</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setSearchPanelOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6 p-4">
          <div>
            <label className="text-sm font-medium">Buscar no Marketplace</label>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Buscar ração, banho, veterinário..."
                value={filters.query}
                onChange={(e) => setFilters({ query: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {searchHistory.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-ecopet-gray">Histórico</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setFilters({ query: h })}
                    className="flex items-center gap-1 rounded-full bg-ecopet-gray/10 px-3 py-1 text-xs hover:bg-ecopet-green/10"
                  >
                    <Clock className="h-3 w-3" /> {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTags.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-ecopet-gray">Filtros ativos</p>
                <button type="button" className="text-xs text-ecopet-green" onClick={resetFilters}>
                  Limpar tudo
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeTags.map((t) => (
                  <Badge key={t.key} variant="default">{t.label}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Tipo</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { v: "", l: "Todos" },
                { v: "product", l: "Produtos" },
                { v: "service", l: "Serviços" },
                { v: "custom", l: "Personalizado" },
              ].map(({ v, l }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFilters({ type: v as typeof filters.type })}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    filters.type === v ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Categoria</label>
            <select
              className="mt-2 flex h-11 w-full rounded-xl border px-4 text-sm"
              value={categorySelectValue(filters.type, filters.category)}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  setFilters({ category: "", type: "" });
                  return;
                }
                const [source, slug] = value.split(":");
                if (!slug || (source !== "product" && source !== "service")) {
                  setFilters({ category: value });
                  return;
                }
                setFilters({
                  category: slug,
                  type: source,
                });
              }}
            >
              <option value="">Todas</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option
                  key={`${c.source}-${c.slug}`}
                  value={categoryOptionValue(c.source, c.slug)}
                >
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Preço mín.</label>
              <Input
                type="number"
                min={0}
                value={filters.priceMin || ""}
                onChange={(e) => setFilters({ priceMin: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Preço máx.</label>
              <Input
                type="number"
                min={0}
                value={filters.priceMax || ""}
                onChange={(e) => setFilters({ priceMax: Number(e.target.value) || 2000 })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Distância máx. ({filters.maxDistance} km)</label>
            <input
              type="range"
              min={1}
              max={50}
              value={filters.maxDistance}
              onChange={(e) => setFilters({ maxDistance: Number(e.target.value) })}
              className="mt-2 w-full accent-ecopet-green"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Avaliação mínima</label>
            <select
              className="mt-2 flex h-11 w-full rounded-xl border px-4 text-sm"
              value={filters.minRating}
              onChange={(e) => setFilters({ minRating: Number(e.target.value) })}
            >
              <option value={0}>Qualquer</option>
              <option value={3}>3+ estrelas</option>
              <option value={4}>4+ estrelas</option>
              <option value={4.5}>4.5+ estrelas</option>
            </select>
          </div>

          <div className="space-y-2">
            {[
              { key: "verifiedOnly" as const, label: "Parceiro verificado" },
              { key: "promoOnly" as const, label: "Em promoção" },
              { key: "freeShipping" as const, label: "Frete grátis" },
              { key: "homeService" as const, label: "Atendimento domicílio" },
              { key: "subscription" as const, label: "Assinatura disponível" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={(e) => setFilters({ [key]: e.target.checked })}
                  className="accent-ecopet-green"
                />
                {label}
              </label>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium">Espécie</label>
            <select
              className="mt-2 flex h-11 w-full rounded-xl border px-4 text-sm"
              value={filters.species}
              onChange={(e) => setFilters({ species: e.target.value })}
            >
              <option value="">Todas</option>
              <option value="dog">Cão</option>
              <option value="cat">Gato</option>
              <option value="bird">Ave</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Ordenar por</label>
            <select
              className="mt-2 flex h-11 w-full rounded-xl border px-4 text-sm"
              value={filters.sort}
              onChange={(e) => setFilters({ sort: e.target.value as typeof filters.sort })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <Button className="w-full" size="lg" onClick={handleSearch}>
            Aplicar filtros
          </Button>
        </div>
      </aside>
    </>
  );
}
