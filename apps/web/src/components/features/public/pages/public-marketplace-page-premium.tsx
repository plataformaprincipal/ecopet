"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SearchBar } from "../search-bar";
import { CategoryChips } from "../category-chips";
import { FilterField, FilterPanel, filterInputClass } from "../filter-panel";
import { PublicProductCard } from "../public-product-card";
import { PublicServiceCard } from "../public-service-card";
import { SkeletonGrid } from "../skeleton-card";
import { EmptyStatePremium } from "../empty-state-premium";
import { fetchPublicMarketplace } from "@/lib/public/client-api";
import { useTranslation } from "@/providers/i18n-provider";
import type { TranslateFn } from "@/lib/i18n";

function MarketplaceFilters({
  t,
  category,
  onCategoryChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  inStock,
  onInStockChange,
}: {
  category: string;
  onCategoryChange: (v: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
  inStock: boolean;
  onInStockChange: (v: boolean) => void;
  t: TranslateFn;
}) {
  const PRODUCT_CATEGORIES = [
    { id: "", label: t("pub.marketplace.catAll") },
    { id: "FOOD", label: t("pub.marketplace.catFood") },
    { id: "HYGIENE", label: t("pub.marketplace.catHygiene") },
    { id: "TOYS", label: t("pub.marketplace.catToys") },
    { id: "ACCESSORIES", label: t("pub.marketplace.catAccessories") },
    { id: "HEALTH", label: t("pub.marketplace.catHealth") },
  ];
  return (
    <>
      <FilterField label={t("pub.marketplace.category")}>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={filterInputClass}
          aria-label={t("pub.marketplace.filterByCategory")}
        >
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c.id || "all"} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField label={t("pub.marketplace.minPrice")}>
        <input
          type="number"
          min={0}
          value={minPrice}
          onChange={(e) => onMinPriceChange(e.target.value)}
          className={filterInputClass}
          aria-label={t("pub.marketplace.minPrice")}
        />
      </FilterField>
      <FilterField label={t("pub.marketplace.maxPrice")}>
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          className={filterInputClass}
          aria-label={t("pub.marketplace.maxPrice")}
        />
      </FilterField>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => onInStockChange(e.target.checked)}
          className="h-4 w-4 rounded"
        />
        {t("pub.marketplace.inStockOnly")}
      </label>
    </>
  );
}

export function PublicMarketplacePagePremium() {
  const { t } = useTranslation();
  const MARKETPLACE_TABS = [
    { id: "all", label: t("pub.marketplace.tabAll") },
    { id: "products", label: t("pub.marketplace.tabProducts") },
    { id: "services", label: t("pub.marketplace.tabServices") },
  ];
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPublicMarketplace>> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        tab,
        inStock: String(inStock),
        pageSize: "24",
      };
      if (q) params.q = q;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const result = await fetchPublicMarketplace(params);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [tab, q, category, minPrice, maxPrice, inStock]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const total = (data?.totalProducts ?? 0) + (data?.totalServices ?? 0);
  const hasItems = (data?.products.length ?? 0) + (data?.services.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-ecopet-green/10 via-white to-ecopet-yellow/10 p-8 dark:from-ecopet-green/20 dark:via-zinc-900 dark:to-ecopet-dark-card">
        <Sparkles className="h-8 w-8 text-ecopet-green" aria-hidden />
        <h1 className="mt-3 font-display text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
          {t("pub.marketplace.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-300">
          {t("pub.marketplace.subtitle")}
        </p>
      </header>

      <SearchBar
        value={q}
        onChange={setQ}
        placeholder={t("pub.marketplace.searchPlaceholder")}
        aria-label={t("pub.marketplace.searchAria")}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CategoryChips items={MARKETPLACE_TABS} activeId={tab} onSelect={setTab} />
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl lg:hidden">
              <Filter className="mr-2 h-4 w-4" aria-hidden />
              {t("pub.marketplace.filters")}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[20px]">
            <DialogHeader>
              <DialogTitle>{t("pub.marketplace.filters")}</DialogTitle>
            </DialogHeader>
            <MarketplaceFilters
              t={t}
              category={category}
              onCategoryChange={setCategory}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              inStock={inStock}
              onInStockChange={setInStock}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <FilterPanel>
          <MarketplaceFilters
            t={t}
            category={category}
            onCategoryChange={setCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            inStock={inStock}
            onInStockChange={setInStock}
          />
        </FilterPanel>

        <div className="space-y-6">
          <p className="text-sm text-zinc-500" aria-live="polite">
            {loading ? t("pub.marketplace.loading") : t("pub.marketplace.results", { count: String(total) })}
          </p>

          {loading ? (
            <SkeletonGrid count={6} />
          ) : !hasItems ? (
            <EmptyStatePremium
              icon={ShoppingBag}
              title={t("pub.marketplace.emptyTitle")}
              description={t("pub.marketplace.emptyDesc")}
              actionLabel={t("pub.marketplace.explore")}
              actionHref="/explorar"
            />
          ) : (
            <>
              {(tab === "all" || tab === "products") && (data?.products.length ?? 0) > 0 ? (
                <section aria-labelledby="products-heading">
                  <h2 id="products-heading" className="mb-4 text-lg font-semibold">
                    {t("pub.marketplace.products")}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {data?.products.map((p, i) => (
                      <PublicProductCard key={p.id} product={{ ...p, featured: i < 2 }} />
                    ))}
                  </div>
                </section>
              ) : null}

              {(tab === "all" || tab === "services") && (data?.services.length ?? 0) > 0 ? (
                <section aria-labelledby="services-heading">
                  <h2 id="services-heading" className="mb-4 text-lg font-semibold">
                    {t("pub.marketplace.services")}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {data?.services.map((s, i) => (
                      <PublicServiceCard key={s.id} service={{ ...s, featured: i < 2 }} />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
