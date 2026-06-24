"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firstProductImageUrl } from "@/lib/catalog/images";
import { useAuthGate } from "@/providers/auth-gate-provider";
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

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PublicProductCardProps = {
  product: PublicProductCardData;
  detailHref?: string;
};

export function PublicProductCard({ product, detailHref }: PublicProductCardProps) {
  const { isAuthenticated } = useAuthGate();
  const router = useRouter();
  const [buyModal, setBuyModal] = useState(false);
  const img = firstProductImageUrl(product.images as string[] | undefined);
  const partnerName = product.seller?.partnerProfile?.businessName;
  const inStock = (product.stock ?? 1) > 0;
  const href = detailHref ?? `/marketplace/produto/${product.id}`;

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-900/60">
        <Link href={href} className="relative block aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              <Package className="h-12 w-12 opacity-40" aria-hidden />
            </div>
          )}
          {product.featured ? (
            <span className="absolute left-3 top-3 rounded-full bg-ecopet-yellow px-3 py-1 text-xs font-semibold text-ecopet-dark">
              Destaque
            </span>
          ) : null}
          {!inStock ? (
            <span className="absolute right-3 top-3 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white">
              Indisponível
            </span>
          ) : null}
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <Link href={href}>
            <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-white">{product.name}</h3>
          </Link>
          <p className="mt-2 text-xl font-bold text-ecopet-green">{formatPrice(product.price)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {product.rating ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-ecopet-yellow text-ecopet-yellow" aria-hidden />
                {product.rating.toFixed(1)}
                {product.reviewCount ? ` (${product.reviewCount})` : ""}
              </span>
            ) : null}
            {partnerName ? <span>{partnerName}</span> : null}
            {product.catalogCategory ? <span>{product.catalogCategory}</span> : null}
          </div>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl">
              <Link href={href}>Ver detalhes</Link>
            </Button>
            <Button
              size="sm"
              className="flex-1 rounded-xl"
              disabled={!inStock}
              onClick={() => {
                if (isAuthenticated) {
                  router.push(href);
                } else {
                  setBuyModal(true);
                }
              }}
            >
              <ShoppingCart className="mr-1 h-4 w-4" aria-hidden />
              Comprar
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
