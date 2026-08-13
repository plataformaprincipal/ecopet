"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, ShoppingBag, Sparkles, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

type SortId = "relevance" | "newest" | "price_asc" | "price_desc" | "popular" | "rating";

type MarketplaceState = {
  tab: string;
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sort: SortId;
  minRating: string;
};

function parseState(params: URLSearchParams): MarketplaceState {
  const sortRaw = params.get("sort") ?? "relevance";
  const sort: SortId =
    sortRaw === "newest" ||
    sortRaw === "price_asc" ||
    sortRaw === "price_desc" ||
    sortRaw === "popular" ||
    sortRaw === "rating"
      ? sortRaw
      : "relevance";

  return {
    tab: params.get("tab") || "all",
    q: params.get("q") || "",
    category: params.get("category") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    inStock: params.get("inStock") !== "false",
    sort,
    minRating: params.get("minRating") || "",
  };
}

function toQuery(state: MarketplaceState): string {
  const q = new URLSearchParams();
  if (state.tab && state.tab !== "all") q.set("tab", state.tab);
  if (state.q) q.set("q", state.q);
  if (state.category) q.set("category", state.category);
  if (state.minPrice) q.set("minPrice", state.minPrice);
  if (state.maxPrice) q.set("maxPrice", state.maxPrice);
  if (!state.inStock) q.set("inStock", "false");
  if (state.sort && state.sort !== "relevance") q.set("sort", state.sort);
  if (state.minRating) q.set("minRating", state.minRating);
  const s = q.toString();
  return s ? `?${s}` : "";
}

function MarketplaceFilters({
  t,
  state,
  onChange,
}: {
  t: TranslateFn;
  state: MarketplaceState;
  onChange: (patch: Partial<MarketplaceState>) => void;
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
    <div className="space-y-4">
      <FilterField label={t("pub.marketplace.category")}>
        <select
          value={state.category}
          onChange={(e) => onChange({ category: e.target.value })}
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

      <FilterField label={t("pub.marketplace.priceRange")}>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={state.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className={filterInputClass}
            aria-label={t("pub.marketplace.minPrice")}
            placeholder="Min"
          />
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={state.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            className={filterInputClass}
            aria-label={t("pub.marketplace.maxPrice")}
            placeholder="Max"
          />
        </div>
      </FilterField>

      <FilterField label={t("pub.marketplace.rating")}>
        <select
          value={state.minRating}
          onChange={(e) => onChange({ minRating: e.target.value })}
          className={filterInputClass}
          aria-label={t("pub.marketplace.rating")}
        >
          <option value="">{t("pub.marketplace.ratingAny")}</option>
          <option value="4">{t("pub.marketplace.rating4")}</option>
          <option value="3">{t("pub.marketplace.rating3")}</option>
        </select>
      </FilterField>

      <FilterField label={t("pub.marketplace.sort")}>
        <select
          value={state.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortId })}
          className={filterInputClass}
          aria-label={t("pub.marketplace.sort")}
        >
          <option value="relevance">{t("pub.marketplace.sortRelevance")}</option>
          <option value="newest">{t("pub.marketplace.sortNewest")}</option>
          <option value="price_asc">{t("pub.marketplace.sortPriceAsc")}</option>
          <option value="price_desc">{t("pub.marketplace.sortPriceDesc")}</option>
          <option value="popular">{t("pub.marketplace.sortPopular")}</option>
          <option value="rating">{t("pub.marketplace.sortRating")}</option>
        </select>
      </FilterField>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ecopet-gray dark:text-white/55">
          {t("pub.marketplace.availability")}
        </legend>
        <label className="flex min-h-11 items-center gap-2 text-sm text-ecopet-dark dark:text-white">
          <input
            type="checkbox"
            checked={state.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
            className="h-4 w-4 rounded border-ecopet-gray/30"
          />
          {t("pub.marketplace.inStockOnly")}
        </label>
      </fieldset>
    </div>
  );
}

export function PublicMarketplacePagePremium() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlState = useMemo(() => parseState(searchParams), [searchParams]);
  const [draft, setDraft] = useState<MarketplaceState>(urlState);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPublicMarketplace>> | null>(null);

  useEffect(() => {
    setDraft(urlState);
  }, [urlState]);

  const pushState = useCallback(
    (next: MarketplaceState) => {
      startTransition(() => {
        router.replace(`${pathname}${toQuery(next)}`, { scroll: false });
      });
    },
    [pathname, router]
  );

  const update = useCallback(
    (patch: Partial<MarketplaceState>) => {
      const next = { ...draft, ...patch };
      if (
        next.minPrice &&
        next.maxPrice &&
        Number(next.minPrice) > Number(next.maxPrice)
      ) {
        // keep UI free; API ignores invalid ranges via numeric parse
      }
      setDraft(next);
      pushState(next);
    },
    [draft, pushState]
  );

  const clearFilters = useCallback(() => {
    const next: MarketplaceState = {
      tab: draft.tab,
      q: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      inStock: true,
      sort: "relevance",
      minRating: "",
    };
    setDraft(next);
    pushState(next);
  }, [draft.tab, pushState]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        tab: urlState.tab,
        inStock: String(urlState.inStock),
        pageSize: "24",
        sort: urlState.sort,
      };
      if (urlState.q) params.q = urlState.q;
      if (urlState.category) params.category = urlState.category;
      if (urlState.minPrice) params.minPrice = urlState.minPrice;
      if (urlState.maxPrice) params.maxPrice = urlState.maxPrice;
      if (urlState.minRating) params.minRating = urlState.minRating;
      const result = await fetchPublicMarketplace(params);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("pub.marketplace.emptyDesc"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [urlState, t]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const MARKETPLACE_TABS = [
    { id: "all", label: t("pub.marketplace.tabAll") },
    { id: "products", label: t("pub.marketplace.tabProducts") },
    { id: "services", label: t("pub.marketplace.tabServices") },
  ];

  const categoryLabel = (id: string) => {
    const map: Record<string, string> = {
      FOOD: t("pub.marketplace.catFood"),
      HYGIENE: t("pub.marketplace.catHygiene"),
      TOYS: t("pub.marketplace.catToys"),
      ACCESSORIES: t("pub.marketplace.catAccessories"),
      HEALTH: t("pub.marketplace.catHealth"),
    };
    return map[id] ?? id;
  };

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: Partial<MarketplaceState> }> = [];
    if (urlState.q) chips.push({ key: "q", label: `“${urlState.q}”`, clear: { q: "" } });
    if (urlState.category)
      chips.push({
        key: "category",
        label: `${t("pub.marketplace.category")}: ${categoryLabel(urlState.category)}`,
        clear: { category: "" },
      });
    if (urlState.minPrice || urlState.maxPrice) {
      const min = urlState.minPrice || "0";
      const max = urlState.maxPrice || "∞";
      chips.push({
        key: "price",
        label: `R$ ${min} – ${max}`,
        clear: { minPrice: "", maxPrice: "" },
      });
    }
    if (urlState.minRating === "4")
      chips.push({ key: "rating", label: t("pub.marketplace.rating4"), clear: { minRating: "" } });
    if (urlState.minRating === "3")
      chips.push({ key: "rating", label: t("pub.marketplace.rating3"), clear: { minRating: "" } });
    if (!urlState.inStock)
      chips.push({
        key: "stock",
        label: t("pub.marketplace.availability"),
        clear: { inStock: true },
      });
    if (urlState.sort !== "relevance")
      chips.push({
        key: "sort",
        label: `${t("pub.marketplace.sort")}: ${t(`pub.marketplace.sort${urlState.sort === "price_asc" ? "PriceAsc" : urlState.sort === "price_desc" ? "PriceDesc" : urlState.sort === "newest" ? "Newest" : urlState.sort === "popular" ? "Popular" : "Rating"}` as never)}`,
        clear: { sort: "relevance" },
      });
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlState, t]);

  const total = (data?.totalProducts ?? 0) + (data?.totalServices ?? 0);
  const hasItems = (data?.products.length ?? 0) + (data?.services.length ?? 0) > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="relative overflow-hidden rounded-[var(--radius-xl)] border border-ecopet-green/15 bg-gradient-to-br from-ecopet-green/[0.08] via-white to-ecopet-cream p-6 sm:p-8 dark:from-ecopet-green/20 dark:via-ecopet-dark-card dark:to-ecopet-dark-bg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ecopet-green/15 blur-3xl" aria-hidden />
        <Sparkles className="h-8 w-8 text-ecopet-green" strokeWidth={2} aria-hidden />
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ecopet-dark dark:text-white sm:text-4xl">
          {t("pub.marketplace.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ecopet-gray dark:text-white/70 sm:text-base">
          {t("pub.marketplace.subtitle")}
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SearchBar
            value={draft.q}
            onChange={(v) => update({ q: v })}
            placeholder={t("pub.marketplace.searchPlaceholder")}
            aria-label={t("pub.marketplace.searchAria")}
          />
        </div>
        {draft.q ? (
          <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => update({ q: "" })}>
            {t("pub.marketplace.clearSearch")}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CategoryChips
          items={MARKETPLACE_TABS}
          activeId={draft.tab}
          onSelect={(id) => update({ tab: id })}
        />
        <div className="flex items-center gap-2">
          <label className="hidden items-center gap-2 text-sm text-ecopet-gray lg:flex dark:text-white/60">
            <span className="sr-only sm:not-sr-only">{t("pub.marketplace.sort")}</span>
            <select
              value={draft.sort}
              onChange={(e) => update({ sort: e.target.value as SortId })}
              className={cn(filterInputClass, "w-auto min-w-[10rem]")}
              aria-label={t("pub.marketplace.sort")}
            >
              <option value="relevance">{t("pub.marketplace.sortRelevance")}</option>
              <option value="newest">{t("pub.marketplace.sortNewest")}</option>
              <option value="price_asc">{t("pub.marketplace.sortPriceAsc")}</option>
              <option value="price_desc">{t("pub.marketplace.sortPriceDesc")}</option>
              <option value="popular">{t("pub.marketplace.sortPopular")}</option>
              <option value="rating">{t("pub.marketplace.sortRating")}</option>
            </select>
          </label>

          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl lg:hidden">
                <Filter className="mr-2 h-4 w-4" aria-hidden />
                {t("pub.marketplace.filters")}
                {activeChips.length > 0 ? (
                  <span className="ml-2 rounded-full bg-ecopet-green px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {activeChips.length}
                  </span>
                ) : null}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto rounded-[20px] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("pub.marketplace.filters")}</DialogTitle>
              </DialogHeader>
              <MarketplaceFilters t={t} state={draft} onChange={(patch) => setDraft((s) => ({ ...s, ...patch }))} />
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    clearFilters();
                    setMobileOpen(false);
                  }}
                >
                  {t("pub.marketplace.clearFilters")}
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    pushState(draft);
                    setMobileOpen(false);
                  }}
                >
                  {t("pub.marketplace.applyFilters")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2" aria-label={t("pub.marketplace.activeFilters")}>
          {activeChips.map((chip) => (
            <button
              key={chip.key + chip.label}
              type="button"
              onClick={() => update(chip.clear)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ecopet-green/25 bg-ecopet-green/10 px-3 text-xs font-medium text-ecopet-dark transition hover:bg-ecopet-green/15 dark:text-white"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ))}
          <Button type="button" variant="ghost" size="sm" className="rounded-xl text-xs" onClick={clearFilters}>
            {t("pub.marketplace.clearFilters")}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <FilterPanel>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ecopet-dark dark:text-white">{t("pub.marketplace.filters")}</h2>
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={clearFilters}>
              {t("pub.marketplace.clearFilters")}
            </Button>
          </div>
          <MarketplaceFilters t={t} state={draft} onChange={update} />
        </FilterPanel>

        <div className="space-y-6">
          <p className="text-sm text-ecopet-gray dark:text-white/60" aria-live="polite">
            {loading
              ? t("pub.marketplace.loading")
              : t("pub.marketplace.results", { count: String(total) })}
          </p>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
              {error}
            </p>
          ) : null}

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
              {(urlState.tab === "all" || urlState.tab === "products") && (data?.products.length ?? 0) > 0 ? (
                <section aria-labelledby="products-heading">
                  <h2 id="products-heading" className="mb-4 text-lg font-semibold text-ecopet-dark dark:text-white">
                    {t("pub.marketplace.products")}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {data?.products.map((p, i) => (
                      <PublicProductCard key={p.id} product={{ ...p, featured: i < 2 }} />
                    ))}
                  </div>
                </section>
              ) : null}

              {(urlState.tab === "all" || urlState.tab === "services") && (data?.services.length ?? 0) > 0 ? (
                <section aria-labelledby="services-heading">
                  <h2 id="services-heading" className="mb-4 text-lg font-semibold text-ecopet-dark dark:text-white">
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
