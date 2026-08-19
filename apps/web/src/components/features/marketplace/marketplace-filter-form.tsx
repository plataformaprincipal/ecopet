"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  MARKETPLACE_FEATURES,
  MARKETPLACE_RADIUS_OPTIONS_KM,
  type MarketplaceQuery,
  type MarketplaceResultType,
} from "@/lib/marketplace/query-model";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_GROUPS, SERVICE_CATEGORIES, SERVICE_CATEGORY_GROUPS } from "@/lib/marketplace/categories";
import { useTranslation } from "@/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SPECIES_OPTIONS = [
  { value: "DOG", labelKey: "marketplace.species.dog" },
  { value: "CAT", labelKey: "marketplace.species.cat" },
  { value: "BIRD", labelKey: "marketplace.species.bird" },
  { value: "FISH", labelKey: "marketplace.species.fish" },
  { value: "RODENT", labelKey: "marketplace.species.rodent" },
  { value: "OTHER", labelKey: "marketplace.species.other" },
] as const;

type Draft = {
  minPrice: string;
  maxPrice: string;
  minRating: string;
  verifiedOnly: boolean;
  promoOnly: boolean;
  inStock: boolean;
  homeService: boolean;
  telehealth: boolean;
  openToday: boolean;
  species: string;
  category: string;
  radiusKm: string;
};

function toDraft(query: MarketplaceQuery): Draft {
  return {
    minPrice: query.minPrice != null ? String(query.minPrice) : "",
    maxPrice: query.maxPrice != null ? String(query.maxPrice) : "",
    minRating: query.minRating != null ? String(query.minRating) : "",
    verifiedOnly: Boolean(query.verifiedOnly),
    promoOnly: Boolean(query.promoOnly),
    inStock: query.inStock !== false,
    homeService: Boolean(query.homeService),
    telehealth: Boolean(query.telehealth),
    openToday: Boolean(query.openToday),
    species: query.species ?? "",
    category: query.category ?? "",
    radiusKm: query.radiusKm != null ? String(query.radiusKm) : "",
  };
}

export function MarketplaceFilterForm({
  query,
  type,
  locationKnown,
  onApply,
  onClear,
  showApply,
}: {
  query: MarketplaceQuery;
  type: MarketplaceResultType;
  locationKnown: boolean;
  onApply: (patch: Partial<MarketplaceQuery>) => void;
  onClear: () => void;
  showApply?: boolean;
}) {
  const { t } = useTranslation();
  const priceId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<Draft>(() => toDraft(query));

  // Sync only when URL-backed fields change. `query` object identity must not reset a draft in progress.
  useEffect(() => {
    setDraft((current) => {
      const next = toDraft(query);
      const urlChanged =
        current.minPrice !== next.minPrice ||
        current.maxPrice !== next.maxPrice ||
        current.minRating !== next.minRating ||
        current.verifiedOnly !== next.verifiedOnly ||
        current.promoOnly !== next.promoOnly ||
        current.inStock !== next.inStock ||
        current.homeService !== next.homeService ||
        current.telehealth !== next.telehealth ||
        current.openToday !== next.openToday ||
        current.species !== next.species ||
        current.category !== next.category ||
        current.radiusKm !== next.radiusKm;
      return urlChanged ? next : current;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toDraft(query) is derived from the listed URL fields
  }, [
    query.minPrice,
    query.maxPrice,
    query.minRating,
    query.verifiedOnly,
    query.promoOnly,
    query.inStock,
    query.homeService,
    query.telehealth,
    query.openToday,
    query.species,
    query.category,
    query.radiusKm,
  ]);

  const grouped = useMemo(() => {
    const categories = type === "service" ? SERVICE_CATEGORIES : type === "partner" ? [] : PRODUCT_CATEGORIES;
    const groups = type === "service" ? SERVICE_CATEGORY_GROUPS : PRODUCT_CATEGORY_GROUPS;
    if (type === "partner") return [];
    return groups
      .map((g) => ({
        ...g,
        items: categories.filter((c) => g.slugs.includes(c.slug)),
      }))
      .filter((g) => g.items.length > 0);
  }, [type]);

  function apply() {
    const min = draft.minPrice ? Number(draft.minPrice) : undefined;
    const max = draft.maxPrice ? Number(draft.maxPrice) : undefined;
    const verified = formRef.current?.querySelector<HTMLInputElement>("[name='verifiedOnly']")?.checked;
    const promo = formRef.current?.querySelector<HTMLInputElement>("[name='promoOnly']")?.checked;
    const stock = formRef.current?.querySelector<HTMLInputElement>("[name='inStock']")?.checked;
    const home = formRef.current?.querySelector<HTMLInputElement>("[name='homeService']")?.checked;
    const telehealth = formRef.current?.querySelector<HTMLInputElement>("[name='telehealth']")?.checked;
    const openToday = formRef.current?.querySelector<HTMLInputElement>("[name='openToday']")?.checked;
    onApply({
      minPrice: Number.isFinite(min) ? min : undefined,
      maxPrice: Number.isFinite(max) ? max : undefined,
      minRating: draft.minRating ? Number(draft.minRating) : undefined,
      verifiedOnly: verified || undefined,
      promoOnly: type !== "partner" ? promo || undefined : undefined,
      inStock: type === "service" || type === "partner" ? undefined : stock !== false,
      homeService: type === "product" || type === "partner" ? undefined : home || undefined,
      telehealth: type === "service" ? telehealth || undefined : undefined,
      openToday: type === "service" ? openToday || undefined : undefined,
      species: type === "partner" ? undefined : draft.species || undefined,
      category: draft.category || undefined,
      radiusKm: locationKnown && draft.radiusKm ? Number(draft.radiusKm) : query.radiusKm,
    });
  }

  const field = "mt-2 flex h-11 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 text-sm text-[var(--ep-fg)]";

  return (
    <form
      ref={formRef}
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      {type !== "partner" && grouped.length > 0 && (
        <details open className="group rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--ep-fg)]">{t("pub.marketplace.category")}</summary>
          <div className="mt-3 space-y-3">
            {grouped.map((g) => (
              <div key={g.id}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ep-fg-muted)]">{t(g.labelKey as never)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, category: d.category === c.slug ? "" : c.slug }))}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        draft.category === c.slug
                          ? "bg-ecopet-green text-white"
                          : "bg-[var(--ep-bg-muted)] text-[var(--ep-fg)] hover:bg-ecopet-green/10"
                      )}
                    >
                      {t(c.labelKey as never)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {type !== "partner" && (
        <fieldset>
          <legend className="text-sm font-medium">{t("pub.marketplace.priceRange")}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={`${priceId}-min`} className="text-xs text-[var(--ep-fg-muted)]">{t("pub.marketplace.minPrice")}</label>
              <Input id={`${priceId}-min`} inputMode="decimal" min={0} type="number" value={draft.minPrice} onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value }))} />
            </div>
            <div>
              <label htmlFor={`${priceId}-max`} className="text-xs text-[var(--ep-fg-muted)]">{t("pub.marketplace.maxPrice")}</label>
              <Input id={`${priceId}-max`} inputMode="decimal" min={0} type="number" value={draft.maxPrice} onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value }))} />
            </div>
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor={`${priceId}-rating`} className="text-sm font-medium">{t("pub.marketplace.rating")}</label>
        <select id={`${priceId}-rating`} className={field} value={draft.minRating} onChange={(e) => setDraft((d) => ({ ...d, minRating: e.target.value }))}>
          <option value="">{t("pub.marketplace.ratingAny")}</option>
          <option value="4.5">{t("marketplace.rating45")}</option>
          <option value="4">{t("pub.marketplace.rating4")}</option>
          <option value="3">{t("pub.marketplace.rating3")}</option>
        </select>
      </div>

      {type !== "partner" && (
        <div>
          <label htmlFor={`${priceId}-species`} className="text-sm font-medium">{t("marketplace.speciesLabel")}</label>
          <select id={`${priceId}-species`} className={field} value={draft.species} onChange={(e) => setDraft((d) => ({ ...d, species: e.target.value }))}>
            <option value="">{t("marketplace.speciesAll")}</option>
            {SPECIES_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{t(s.labelKey as never)}</option>
            ))}
          </select>
        </div>
      )}

      {locationKnown && (
        <div>
          <label htmlFor={`${priceId}-radius`} className="text-sm font-medium">{t("marketplace.radiusLabel")}</label>
          <select id={`${priceId}-radius`} className={field} value={draft.radiusKm} onChange={(e) => setDraft((d) => ({ ...d, radiusKm: e.target.value }))}>
            {MARKETPLACE_RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>{km} km</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <input
            id={`${priceId}-verified`}
            data-testid="marketplace-filter-verified"
            name="verifiedOnly"
            type="checkbox"
            className="accent-ecopet-green"
            checked={draft.verifiedOnly}
            onChange={(e) => setDraft((d) => ({ ...d, verifiedOnly: e.target.checked }))}
          />
          <label htmlFor={`${priceId}-verified`}>{t("marketplace.verifiedOnly")}</label>
        </div>
        {type !== "service" && type !== "partner" && (
          <div className="flex items-center gap-2 text-sm">
            <input id={`${priceId}-stock`} name="inStock" type="checkbox" className="accent-ecopet-green" checked={draft.inStock} onChange={(e) => setDraft((d) => ({ ...d, inStock: e.target.checked }))} />
            <label htmlFor={`${priceId}-stock`}>{t("pub.marketplace.inStockOnly")}</label>
          </div>
        )}
        {type !== "partner" && (
          <div className="flex items-center gap-2 text-sm">
            <input id={`${priceId}-promo`} name="promoOnly" type="checkbox" className="accent-ecopet-green" checked={draft.promoOnly} onChange={(e) => setDraft((d) => ({ ...d, promoOnly: e.target.checked }))} />
            <label htmlFor={`${priceId}-promo`}>{t("marketplace.promoOnly")}</label>
          </div>
        )}
        {(type === "service" || type === "all") && (
          <div className="flex items-center gap-2 text-sm">
            <input id={`${priceId}-home`} name="homeService" type="checkbox" className="accent-ecopet-green" checked={draft.homeService} onChange={(e) => setDraft((d) => ({ ...d, homeService: e.target.checked }))} />
            <label htmlFor={`${priceId}-home`}>{t("marketplace.homeService")}</label>
          </div>
        )}
        {type === "service" && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <input
                id={`${priceId}-telehealth`}
                data-testid="marketplace-filter-telehealth"
                name="telehealth"
                type="checkbox"
                className="accent-ecopet-green"
                checked={draft.telehealth}
                onChange={(e) => setDraft((d) => ({ ...d, telehealth: e.target.checked }))}
              />
              <label htmlFor={`${priceId}-telehealth`}>{t("marketplace.servicesPage.telehealth")}</label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <input
                id={`${priceId}-openToday`}
                data-testid="marketplace-filter-opentoday"
                name="openToday"
                type="checkbox"
                className="accent-ecopet-green"
                checked={draft.openToday}
                onChange={(e) => setDraft((d) => ({ ...d, openToday: e.target.checked }))}
              />
              <label htmlFor={`${priceId}-openToday`}>{t("marketplace.servicesPage.rails.openToday")}</label>
            </div>
          </>
        )}
        {MARKETPLACE_FEATURES.freeShipping ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-ecopet-green" />
            {t("marketplace.freeShipping")}
          </label>
        ) : null}
      </div>

      <div className={cn("flex gap-2", showApply && "sticky bottom-0 bg-[var(--ep-bg-elevated)] pt-3")}>
        <button type="button" className="text-sm font-medium text-ecopet-green" onClick={onClear}>
          {t("pub.marketplace.clearFilters")}
        </button>
        <button
          type="submit"
          data-testid="marketplace-apply-filters"
          className="ml-auto rounded-xl bg-ecopet-green px-4 py-2 text-sm font-semibold text-white"
        >
          {t("pub.marketplace.applyFilters")}
        </button>
      </div>
    </form>
  );
}
