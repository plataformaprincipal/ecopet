"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Scale, Sparkles, Truck, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./rating-stars";
import { formatMpPrice, discountPct, AI_TAG_LABELS } from "@/lib/marketplace/config";
import { useMarketplaceStore } from "@/store/marketplace-store";
import type { MarketplaceProduct } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: MarketplaceProduct;
  compact?: boolean;
}

export function ProductCard({ product, compact }: ProductCardProps) {
  const { addToCart, toggleFavoriteProduct, toggleCompare, isFavoriteProduct, isInCompare } =
    useMarketplaceStore();
  const discount = discountPct(product.price, product.comparePrice);
  const fav = isFavoriteProduct(product.id);
  const comparing = isInCompare("product", product.id);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ecopet-gray/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/5">
      <Link href={`/marketplace/produto/${product.id}`} className="relative block aspect-square overflow-hidden bg-gray-100">
        <Image src={product.images[0]} alt={product.name} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width:768px) 50vw, 25vw" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {product.isPromo && discount > 0 && (
            <Badge className="bg-red-500 text-white">-{discount}%</Badge>
          )}
          {product.isSponsored && <Badge variant="premium">Patrocinado</Badge>}
          {product.aiTag && (
            <Badge variant="premium" className="gap-0.5">
              <Sparkles className="h-3 w-3" />
              {AI_TAG_LABELS[product.aiTag]}
            </Badge>
          )}
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold">Esgotado</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 lg:p-4">
        <p className="text-[10px] font-medium uppercase tracking-wide text-ecopet-green">{product.category}</p>
        <Link href={`/marketplace/produto/${product.id}`}>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug hover:text-ecopet-green">{product.name}</h3>
        </Link>

        <Link href={`/marketplace/parceiro/${product.partnerId}`} className="mt-1 flex items-center gap-1 text-xs text-ecopet-gray hover:text-ecopet-green">
          {product.partner.isVerified && <BadgeCheck className="h-3 w-3 text-blue-500" />}
          {product.partner.name}
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ecopet-green">{formatMpPrice(product.price)}</span>
          {product.comparePrice && (
            <span className="text-xs text-ecopet-gray line-through">{formatMpPrice(product.comparePrice)}</span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ecopet-gray">
          <RatingStars rating={product.rating} />
          <span>({product.reviewCount})</span>
          {product.freeShipping && (
            <span className="flex items-center gap-0.5 text-ecopet-green">
              <Truck className="h-3 w-3" /> Frete grátis
            </span>
          )}
          {product.inStock && (
            <span>Entrega ~{product.deliveryDays}d</span>
          )}
        </div>

        {!compact && (
          <div className="mt-auto flex gap-1.5 pt-3">
            <Button
              size="sm"
              className="flex-1"
              disabled={!product.inStock}
              onClick={() =>
                addToCart({
                  type: "product",
                  itemId: product.id,
                  name: product.name,
                  image: product.images[0],
                  price: product.price,
                  quantity: 1,
                  partnerId: product.partnerId,
                  partnerName: product.partner.name,
                })
              }
            >
              <ShoppingCart className="h-4 w-4" />
              Carrinho
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={cn("px-2.5", fav && "border-red-300 text-red-500")}
              onClick={() => toggleFavoriteProduct(product.id)}
              aria-label="Favoritar"
            >
              <Heart className={cn("h-4 w-4", fav && "fill-red-500")} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn("px-2.5", comparing && "text-ecopet-green")}
              onClick={() => toggleCompare("product", product.id)}
              aria-label="Comparar"
            >
              <Scale className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
