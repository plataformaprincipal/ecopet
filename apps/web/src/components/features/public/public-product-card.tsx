"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firstProductImageUrl } from "@/lib/catalog/images";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency } from "@/lib/i18n/format";
import { LoginRequiredModal } from "./login-required-modal";
import { useState } from "react";

export type PublicProductCardData = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  catalogCategory?: string | null;
  images?: unknown;
  shortDescription?: string | null;
  seller?: { id?: string; partnerProfile?: { businessName?: string; city?: string } | null } | null;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
};

type PublicProductCardProps = {
  product: PublicProductCardData;
  detailHref?: string;
};

export function PublicProductCard({ product, detailHref }: PublicProductCardProps) {
  const { isAuthenticated } = useAuthGate();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [buyModal, setBuyModal] = useState(false);
  const img = firstProductImageUrl(product.images as string[] | undefined);
  const partnerName = product.seller?.partnerProfile?.businessName;
  const inStock = (product.stock ?? 1) > 0;
  const href = detailHref ?? `/marketplace/produto/${product.id}`;

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:bg-ecopet-dark-card">
        <Link href={href} className="relative block aspect-[4/3] bg-ecopet-cream/60 dark:bg-ecopet-dark">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-ecopet-gray/50">
              <Package className="h-12 w-12 opacity-40" strokeWidth={2} aria-hidden />
            </div>
          )}
          {product.featured ? (
            <span className="absolute left-3 top-3 rounded-full bg-ecopet-green px-3 py-1 text-xs font-semibold text-white shadow-[var(--shadow-xs)]">
              {t("pub.card.featured")}
            </span>
          ) : null}
          {!inStock ? (
            <span className="absolute right-3 top-3 rounded-full bg-ep-danger/90 px-3 py-1 text-xs font-semibold text-white">
              {t("pub.card.unavailable")}
            </span>
          ) : null}
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <Link href={href}>
            <h3 className="line-clamp-2 font-display font-semibold text-ecopet-dark dark:text-white">{product.name}</h3>
          </Link>
          <p className="mt-2 text-xl font-bold text-ecopet-green">{formatCurrency(product.price, locale)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ecopet-gray dark:text-white/60">
            {product.rating ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-ecopet-green text-ecopet-green" strokeWidth={2} aria-hidden />
                {product.rating.toFixed(1)}
                {product.reviewCount ? ` (${product.reviewCount})` : ""}
              </span>
            ) : null}
            {partnerName ? <span>{partnerName}</span> : null}
            {product.catalogCategory ? <span>{product.catalogCategory}</span> : null}
          </div>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1 rounded-[var(--radius-button)]">
              <Link href={href}>{t("pub.card.viewDetails")}</Link>
            </Button>
            <Button
              size="sm"
              className="flex-1 rounded-[var(--radius-button)]"
              disabled={!inStock}
              onClick={() => {
                if (isAuthenticated) {
                  router.push(href);
                } else {
                  setBuyModal(true);
                }
              }}
            >
              <ShoppingCart className="mr-1 h-4 w-4" strokeWidth={2} aria-hidden />
              {t("pub.card.buy")}
            </Button>
          </div>
        </div>
      </article>
      <LoginRequiredModal
        open={buyModal}
        onOpenChange={setBuyModal}
        titleKey="public.authModal.buyTitle"
        descriptionKey="public.authModal.buyDescription"
      />
    </>
  );
}
