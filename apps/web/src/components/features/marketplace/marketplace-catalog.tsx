"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketplaceOverlay } from "./marketplace-overlay";
import { ProductCard } from "./product-card";
import { ServiceCard } from "./service-card";
import { PartnerCard } from "./partner-card";
import { EmptyState } from "./empty-state";
import { MarketplaceGridSkeleton } from "./marketplace-skeleton";
import { MarketplaceFilterForm } from "./marketplace-filter-form";
import { fetchMarketplaceCatalog } from "@/lib/marketplace/api";
import {
  MARKETPLACE_DEFAULT_RADIUS_KM,
  MARKETPLACE_SEARCH_DEBOUNCE_MS,
  countActiveMarketplaceFilters,
  enabledMarketplaceSorts,
  formatDistanceKm,
  marketplaceCacheKey,
  nextRadiusKm,
  type MarketplaceQuery,
  type MarketplaceResultType,
} from "@/lib/marketplace/query-model";
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES } from "@/lib/marketplace/categories";
import type { MarketplacePartner, MarketplaceProduct, MarketplaceService } from "@/lib/marketplace/types";
import { useMarketplaceQuery } from "@/hooks/use-marketplace-query";
import { useUserLocation } from "@/hooks/use-user-location";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

const TABS: { id: MarketplaceResultType; labelKey: string }[] = [
  { id: "all", labelKey: "pub.marketplace.tabAll" },
  { id: "product", labelKey: "pub.marketplace.tabProducts" },
  { id: "service", labelKey: "pub.marketplace.tabServices" },
  { id: "partner", labelKey: "marketplace.tabs.partners" },
];

export function MarketplaceCatalog({ defaultType = "all" }: { defaultType?: MarketplaceResultType }) {
  const { t } = useTranslation();
  const { query, setQuery, clearFilters } = useMarketplaceQuery({ type: defaultType });
  const location = useUserLocation();
  const [search, setSearch] = useState(query.q ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [partners, setPartners] = useState<MarketplacePartner[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [cep, setCep] = useState("");
  const [city, setCity] = useState("");
  const filterReturn = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<string>("");

  const type = query.type ?? defaultType;
  const activeCount = countActiveMarketplaceFilters(query);
  const geo = location.known && location.coords ? location.coords : undefined;

  useEffect(() => {
    setSearch(query.q ?? "");
  }, [query.q]);

  function commitSearch(raw?: string) {
    const next = (raw ?? searchInputRef.current?.value ?? search).trim();
    if ((query.q ?? "") !== next) setQuery({ q: next || undefined, page: 1 });
  }

  useEffect(() => {
    const handle = window.setTimeout(() => commitSearch(), MARKETPLACE_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const key = marketplaceCacheKey(query, geo);
    cacheRef.current = key;
    setLoading(true);
    setError(false);
    fetchMarketplaceCatalog({ ...query, type, pageSize: query.pageSize ?? 12 }, geo)
      .then((data) => {
        if (ac.signal.aborted) return;
        setProducts(data.products);
        setServices(data.services);
        setPartners(data.partners);
        setTotal(typeof data.total === "number" ? data.total : null);
      })
      .catch(() => {
        if (!ac.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [query, type, geo?.lat, geo?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onUseBrowserLocation() {
    setLocationPrompt(false);
    if (location.known && location.coords) {
      setQuery({
        near: true,
        sort: "near_me",
        radiusKm: MARKETPLACE_DEFAULT_RADIUS_KM,
        city: location.meta.city,
      });
      return;
    }
    const result = await location.request();
    if (result.state === "granted" && result.coords) {
      setQuery({ near: true, sort: "near_me", radiusKm: MARKETPLACE_DEFAULT_RADIUS_KM });
      return;
    }
    setManualOpen(true);
  }

  async function applyManual() {
    if (cep.replace(/\D/g, "").length === 8) {
      const r = await location.setCep(cep);
      if (r.ok && r.coords) {
        setManualOpen(false);
        setQuery({ near: true, sort: "near_me", radiusKm: MARKETPLACE_DEFAULT_RADIUS_KM, city: r.city });
        return;
      }
    }
    if (city.trim()) {
      const r = await location.setCity(city.trim());
      if (r.ok && r.coords) {
        setManualOpen(false);
        setQuery({ near: true, sort: "near_me", radiusKm: MARKETPLACE_DEFAULT_RADIUS_KM, city: city.trim() });
      }
    }
  }

  const chips = useMemo(() => {
    const list: { key: string; label: string; clear: Partial<MarketplaceQuery> }[] = [];
    if (query.category) {
      const cat = [...PRODUCT_CATEGORIES, ...SERVICE_CATEGORIES].find((c) => c.slug === query.category);
      list.push({ key: "category", label: cat ? t(cat.labelKey as never) : query.category, clear: { category: undefined } });
    }
    if (query.maxPrice != null) list.push({ key: "max", label: t("marketplace.chipMaxPrice", { value: String(query.maxPrice) }), clear: { maxPrice: undefined } });
    if (query.minPrice != null) list.push({ key: "min", label: t("marketplace.chipMinPrice", { value: String(query.minPrice) }), clear: { minPrice: undefined } });
    if (query.minRating) list.push({ key: "rating", label: t("marketplace.chipRating", { value: String(query.minRating) }), clear: { minRating: undefined } });
    if (query.verifiedOnly) list.push({ key: "verified", label: t("marketplace.verifiedOnly"), clear: { verifiedOnly: undefined } });
    if (query.promoOnly) list.push({ key: "promo", label: t("marketplace.promoOnly"), clear: { promoOnly: undefined } });
    if (query.homeService) list.push({ key: "home", label: t("marketplace.homeService"), clear: { homeService: undefined } });
    if (query.telehealth) list.push({ key: "telehealth", label: t("marketplace.servicesPage.telehealth"), clear: { telehealth: undefined } });
    if (query.openToday) list.push({ key: "openToday", label: t("marketplace.servicesPage.rails.openToday"), clear: { openToday: undefined } });
    if (query.species) list.push({ key: "species", label: query.species, clear: { species: undefined } });
    if (query.group) list.push({ key: "group", label: t(`marketplace.servicesPage.verticals.${query.group}` as never), clear: { group: undefined } });
    if (query.near) list.push({ key: "near", label: t("marketplace.filterTags.nearMe"), clear: { near: false, sort: "relevance" } });
    return list;
  }, [query, t]);

  const empty = !loading && !error && products.length + services.length + partners.length === 0;
  const radiusEmpty = empty && query.near && query.radiusKm != null;
  const nextRadius = query.radiusKm != null ? nextRadiusKm(query.radiusKm) : 5;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          role="search"
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const native = new FormData(e.currentTarget).get("q");
            commitSearch(typeof native === "string" ? native : undefined);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ep-fg-muted)]" aria-hidden />
          <Input
            key={query.q ?? "empty"}
            ref={searchInputRef}
            data-testid="marketplace-search"
            name="q"
            type="search"
            defaultValue={query.q ?? ""}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              commitSearch(e.currentTarget.value);
            }}
            placeholder={t("marketplace.searchPlaceholder")}
            aria-label={t("pub.marketplace.searchAria")}
            className="h-11 pl-10"
          />
        </form>
        <div className="flex gap-2">
          <Button
            ref={filterReturn}
            variant="outline"
            className="lg:hidden"
            data-testid="marketplace-open-filters"
            aria-haspopup="dialog"
            onClick={() => {
              window.setTimeout(() => setMobileOpen(true), 0);
            }}
          >
            <SlidersHorizontal className="h-4 w-4" /> {t("pub.marketplace.filters")}
            {activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
          <Button
            variant={query.near ? "default" : "outline"}
            data-testid="marketplace-near-me"
            onClick={() => {
              if (query.near) {
                setQuery({ near: false, sort: "relevance" });
                return;
              }
              window.setTimeout(() => setLocationPrompt(true), 0);
            }}
          >
            <MapPin className="h-4 w-4" aria-hidden /> {t("marketplace.filterTags.nearMe")}
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label={t("marketplace.tabsLabel")}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={type === tab.id}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold",
              type === tab.id ? "bg-ecopet-green text-white" : "bg-[var(--ep-bg-muted)] text-[var(--ep-fg)]"
            )}
            onClick={() => setQuery({ type: tab.id, category: undefined, page: 1 })}
          >
            {t(tab.labelKey as never)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="mp-sort" className="text-xs font-medium text-[var(--ep-fg-muted)]">{t("pub.marketplace.sort")}</label>
        <select
          id="mp-sort"
          className="h-10 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 text-sm"
          value={query.sort ?? "relevance"}
          onChange={(e) => {
            const sort = e.target.value as MarketplaceQuery["sort"];
            if (sort === "near_me") setLocationPrompt(true);
            else setQuery({ sort });
          }}
        >
          {enabledMarketplaceSorts(type).map((s) => (
            <option key={s.value} value={s.value}>{t(s.labelKey as never)}</option>
          ))}
        </select>
        {typeof total === "number" ? (
          <span className="text-xs text-[var(--ep-fg-muted)]">{t("pub.marketplace.results", { count: String(total) })}</span>
        ) : (
          <span className="text-xs text-[var(--ep-fg-muted)]">{t("marketplace.resultsFound")}</span>
        )}
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--ep-fg-muted)]">{t("pub.marketplace.filtersCount", { count: String(activeCount) })}</span>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-ecopet-green/10 px-3 py-1 text-xs font-medium text-ecopet-green"
              onClick={() => setQuery(c.clear)}
            >
              {c.label} <X className="h-3 w-3" aria-hidden />
            </button>
          ))}
          <button type="button" className="text-xs font-semibold text-ecopet-green" onClick={clearFilters}>
            {t("marketplace.clearAll")}
          </button>
        </div>
      )}

      {location.known && location.label ? (
        <p className="text-xs text-[var(--ep-fg-muted)]">
          <MapPin className="mr-1 inline h-3 w-3" aria-hidden />
          {location.label}
          {query.radiusKm ? ` · ${query.radiusKm} km` : ""}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block">
          <h2 className="mb-3 font-display text-sm font-bold">{t("pub.marketplace.filters")}</h2>
          <MarketplaceFilterForm
            query={query}
            type={type}
            locationKnown={location.known}
            onApply={(patch) => setQuery(patch)}
            onClear={clearFilters}
          />
        </aside>

        <div>
          {error ? (
            <EmptyState
              icon={Search}
              title={t("marketplace.loadError")}
              actionLabel={t("marketplace.retry")}
              onAction={() => setQuery({ page: query.page ?? 1 })}
            />
          ) : loading ? (
            <MarketplaceGridSkeleton type={type === "service" ? "service" : "product"} />
          ) : empty ? (
            <EmptyState
              icon={Search}
              title={radiusEmpty ? t("marketplace.emptyRadius", { km: String(query.radiusKm) }) : t("marketplace.emptyFilters")}
              description={t("marketplace.emptyHint")}
              actionLabel={radiusEmpty && nextRadius ? t("marketplace.increaseRadius", { km: String(nextRadius) }) : t("pub.marketplace.clearFilters")}
              onAction={() => {
                if (radiusEmpty && nextRadius) setQuery({ radiusKm: nextRadius });
                else clearFilters();
              }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
              {services.map((s) => <ServiceCard key={s.id} service={s} />)}
              {partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
            </div>
          )}
        </div>
      </div>

      <MarketplaceOverlay
        open={mobileOpen}
        onClose={() => {
          setMobileOpen(false);
          filterReturn.current?.focus();
        }}
        title={t("pub.marketplace.filters")}
        description={t("marketplace.filtersHint")}
        testId="marketplace-filters-sheet"
        placement="bottom"
      >
        <MarketplaceFilterForm
          query={query}
          type={type}
          locationKnown={location.known}
          showApply
          onApply={(patch) => {
            setQuery(patch);
            setMobileOpen(false);
          }}
          onClear={clearFilters}
        />
      </MarketplaceOverlay>

      <MarketplaceOverlay
        open={locationPrompt || manualOpen}
        onClose={() => {
          setLocationPrompt(false);
          setManualOpen(false);
        }}
        title={manualOpen ? t("marketplace.manualLocationTitle") : t("marketplace.locationTitle")}
        description={manualOpen ? t("marketplace.manualLocationBody") : t("marketplace.locationBody")}
        testId={manualOpen ? "marketplace-manual-location" : "marketplace-location-dialog"}
      >
        {manualOpen ? (
          <>
            <label className="text-sm font-medium" htmlFor="mp-cep">CEP</label>
            <Input id="mp-cep" value={cep} onChange={(e) => setCep(e.target.value)} inputMode="numeric" placeholder="58000-000" />
            <label className="text-sm font-medium" htmlFor="mp-city">{t("marketplace.cityLabel")}</label>
            <Input id="mp-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("marketplace.cityPlaceholder")} />
            <Button className="mt-3" onClick={() => void applyManual()}>{t("marketplace.saveLocation")}</Button>
          </>
        ) : (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="rounded-xl bg-ecopet-green px-4 py-2.5 text-sm font-semibold text-white"
              onClick={() => void onUseBrowserLocation()}
            >
              {t("marketplace.useMyLocation")}
            </button>
            <button
              type="button"
              data-testid="marketplace-enter-manually"
              className="rounded-xl border-2 border-ecopet-green px-4 py-2.5 text-sm font-semibold text-ecopet-green"
              onClick={() => {
                window.setTimeout(() => {
                  setLocationPrompt(false);
                  setManualOpen(true);
                }, 0);
              }}
            >
              {t("marketplace.enterManually")}
            </button>
            <button
              type="button"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--ep-fg-muted)]"
              onClick={() => setLocationPrompt(false)}
            >
              {t("marketplace.notNow")}
            </button>
          </div>
        )}
      </MarketplaceOverlay>
    </div>
  );
}

export function MarketplaceDistance({ km }: { km?: number | null }) {
  if (km == null || !Number.isFinite(km) || km < 0) return null;
  return <span>{formatDistanceKm(km)}</span>;
}
