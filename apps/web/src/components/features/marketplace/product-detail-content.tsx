"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Shield, Truck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "./rating-stars";
import { ProductCard } from "./product-card";
import { MarketplaceGridSkeleton } from "./marketplace-skeleton";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { fetchProduct, fetchReviews, fetchRelatedProducts } from "@/lib/marketplace/api";
import { formatMpPrice, discountPct, AI_TAG_LABELS } from "@/lib/marketplace/config";
import type { MarketplaceProduct, MarketplaceReview } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

interface ProductDetailContentProps {
  id: string;
}

export function ProductDetailContent({ id }: ProductDetailContentProps) {
  const { addToCart, toggleFavoriteProduct, isFavoriteProduct } = useMarketplaceStore();
  const [product, setProduct] = useState<MarketplaceProduct | undefined>();
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [related, setRelated] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchProduct(id),
      fetchReviews(id),
      fetchRelatedProducts(id),
    ]).then(([p, r, rel]) => {
      setProduct(p);
      setReviews(r);
      setRelated(rel);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <MarketplaceGridSkeleton count={1} />;
  if (!product) return <p className="text-ecopet-gray">Produto não encontrado.</p>;

  const discount = discountPct(product.price, product.comparePrice);
  const fav = isFavoriteProduct(product.id);

  return (
    <div>
      <Link href="/marketplace/produtos" className="mb-4 inline-flex items-center gap-1 text-sm text-ecopet-green">
        <ChevronLeft className="h-4 w-4" /> Voltar aos produtos
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
            <Image src={product.images[imgIdx]} alt={product.name} fill className="object-cover" priority />
          </div>
          {product.images.length > 1 && (
            <div className="mt-2 flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} type="button" onClick={() => setImgIdx(i)} className={cn("relative h-16 w-16 overflow-hidden rounded-lg border-2", imgIdx === i ? "border-ecopet-green" : "border-transparent")}>
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {product.isPromo && discount > 0 && <Badge className="bg-red-500 text-white">-{discount}%</Badge>}
            {product.aiTag && <Badge variant="premium">{AI_TAG_LABELS[product.aiTag]}</Badge>}
            {!product.inStock && <Badge variant="outline">Esgotado</Badge>}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold lg:text-3xl">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={product.rating} size="md" />
            <span className="text-sm text-ecopet-gray">({product.reviewCount} avaliações)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-ecopet-green">{formatMpPrice(product.price)}</span>
            {product.comparePrice && <span className="text-lg text-ecopet-gray line-through">{formatMpPrice(product.comparePrice)}</span>}
          </div>

          <Link href={`/marketplace/parceiro/${product.partnerId}`} className="mt-4 inline-flex items-center gap-2 rounded-xl border p-3 hover:border-ecopet-green">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image src={product.partner.avatar} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold">{product.partner.name}</p>
              <p className="text-xs text-ecopet-gray">{product.partner.location}</p>
            </div>
            {product.partner.isVerified && <Badge variant="verified">Verificado</Badge>}
          </Link>

          <p className="mt-4 text-ecopet-gray">{product.longDescription ?? product.description}</p>

          {product.species && (
            <p className="mt-2 text-sm"><strong>Espécie:</strong> {product.species.join(", ")}</p>
          )}
          {product.sizes && (
            <p className="text-sm"><strong>Porte:</strong> {product.sizes.join(", ")}</p>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm text-ecopet-gray">
            {product.freeShipping && <span className="flex items-center gap-1"><Truck className="h-4 w-4 text-ecopet-green" /> Frete grátis</span>}
            {product.inStock && <span>Entrega em ~{product.deliveryDays} dias</span>}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-xl border">
              <button type="button" className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button type="button" className="px-3 py-2" onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <Button
              className="flex-1"
              size="lg"
              disabled={!product.inStock}
              onClick={() => addToCart({
                type: "product", itemId: product.id, name: product.name, image: product.images[0],
                price: product.price, quantity: qty, partnerId: product.partnerId, partnerName: product.partner.name,
              })}
            >
              <ShoppingCart className="h-5 w-5" /> Adicionar ao carrinho
            </Button>
            <Button size="lg" variant="outline" className={cn(fav && "text-red-500")} onClick={() => toggleFavoriteProduct(product.id)}>
              <Heart className={cn("h-5 w-5", fav && "fill-red-500")} />
            </Button>
          </div>

          <Link href="/marketplace/checkout" className="mt-3 block">
            <Button variant="secondary" className="w-full" size="lg" disabled={!product.inStock}>Comprar agora</Button>
          </Link>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            Compra protegida ECOPET. Verifique compatibilidade com seu pet antes de medicamentos ou suplementos.
          </div>
        </div>
      </div>

      {product.specs && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-bold">Especificações</h3>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-ecopet-gray/10 py-2 text-sm">
                  <dt className="text-ecopet-gray">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {product.faq && (
        <Card className="mt-4">
          <CardContent className="p-6">
            <h3 className="font-bold">Perguntas frequentes</h3>
            <div className="mt-3 space-y-3">
              {product.faq.map((f) => (
                <div key={f.q}>
                  <p className="text-sm font-semibold">{f.q}</p>
                  <p className="text-sm text-ecopet-gray">{f.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <section className="mt-8">
        <h3 className="mb-4 font-bold">Avaliações ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-ecopet-gray">Ainda sem avaliações.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <RatingStars rating={r.rating} />
                  <span className="text-sm font-semibold">{r.author}</span>
                </div>
                <p className="mt-2 text-sm">{r.comment}</p>
                {r.partnerReply && <p className="mt-2 text-xs text-ecopet-green">Resposta: {r.partnerReply}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-4 font-bold">Produtos relacionados</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} compact />)}
          </div>
        </section>
      )}
    </div>
  );
}
