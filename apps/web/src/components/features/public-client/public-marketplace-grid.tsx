"use client";

import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firstProductImageUrl } from "@/lib/catalog/images";
import { loginUrl } from "@/lib/public-client/nav";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency } from "@/lib/i18n/format";
import { PublicEmptyState } from "./public-empty-state";

export type PublicMarketplaceItem = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  catalogCategory?: string | null;
  images?: unknown;
  shortDescription?: string | null;
  seller?: {
    id?: string;
    partnerProfile?: { businessName?: string; city?: string } | null;
  } | null;
};

type PublicMarketplaceGridProps = {
  products: PublicMarketplaceItem[];
  detailBase?: string;
  loading?: boolean;
};

export function PublicMarketplaceGrid({
  products,
  detailBase = "/marketplace/produto",
}: PublicMarketplaceGridProps) {
  const { t, locale } = useTranslation();
  if (products.length === 0) {
    return (
      <PublicEmptyState
        icon={ShoppingBag}
        title={t("pub.marketplace.emptyTitle")}
        description={t("pub.marketplace.emptyDesc")}
        actionLabel={t("pub.marketplace.explore")}
        actionHref="/explorar"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const img = firstProductImageUrl(product.images as string[] | undefined);
        const partnerName = product.seller?.partnerProfile?.businessName;
        const inStock = (product.stock ?? 0) > 0;

        return (
          <article
            key={product.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
          >
            <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  <Package className="h-10 w-10 opacity-40" aria-hidden />
                </div>
              )}
              {!inStock ? (
                <span className="absolute left-3 top-3 rounded-md bg-red-500/90 px-2 py-0.5 text-[11px] font-semibold uppercase text-white">
                  {t("pub.card.unavailable")}
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-2 font-medium text-zinc-900 dark:text-white">{product.name}</h3>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                {formatCurrency(product.price, locale)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {product.catalogCategory ?? t("pub.marketplace.products")}
                {partnerName ? ` · ${partnerName}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`${detailBase}/${product.id}`}>{t("pub.card.viewDetails")}</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link href={loginUrl(`/marketplace/produto/${product.id}`)}>{t("public.authModal.buyTitle")}</Link>
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function PublicMarketplaceFilters({
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
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">{t("pub.marketplace.category")}</span>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
          aria-label={t("pub.marketplace.filterByCategory")}
        >
          <option value="">{t("pub.marketplace.catAll")}</option>
          <option value="FOOD">{t("pub.marketplace.catFood")}</option>
          <option value="HYGIENE">{t("pub.marketplace.catHygiene")}</option>
          <option value="TOYS">{t("pub.marketplace.catToys")}</option>
          <option value="ACCESSORIES">{t("pub.marketplace.catAccessories")}</option>
          <option value="HEALTH">{t("pub.marketplace.catHealth")}</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">{t("pub.marketplace.minPrice")}</span>
        <input
          type="number"
          min={0}
          value={minPrice}
          onChange={(e) => onMinPriceChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
          aria-label={t("pub.marketplace.minPrice")}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">{t("pub.marketplace.maxPrice")}</span>
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
          aria-label={t("pub.marketplace.maxPrice")}
        />
      </label>
      <label className="flex items-end gap-2 text-sm">
        <input
          id="in-stock-filter"
          type="checkbox"
          checked={inStock}
          onChange={(e) => onInStockChange(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <span className="pb-2 font-medium text-zinc-700 dark:text-zinc-300">{t("pub.marketplace.inStockOnly")}</span>
      </label>
    </div>
  );
}
