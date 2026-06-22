"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Package, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { PublicSearchBar } from "@/components/features/public-client/public-search-bar";
import {
  PublicMarketplaceFilters,
  type PublicMarketplaceItem,
} from "@/components/features/public-client/public-marketplace-grid";
import { ClientEmptyState } from "../client-empty-state";
import { ClientGridSkeleton, ClientSkeleton } from "../client-skeleton";
import { ClientFeedback } from "../client-stats-cards";
import { firstProductImageUrl } from "@/lib/catalog/images";

function formatPrice(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ClientMarketplacePage() {
  const [products, setProducts] = useState<PublicMarketplaceItem[]>([]);
  const [favorites, setFavorites] = useState<PublicMarketplaceItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const [cartCount, setCartCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("inStock", String(inStock));
      params.set("pageSize", "24");

      const [prodRes, favRes, cartRes] = await Promise.all([
        fetch(`/api/public/products?${params}`, { credentials: "include" }),
        fetch("/api/client/favorites", { credentials: "include" }),
        fetch("/api/cart", { credentials: "include" }),
      ]);
      const prodJson = await prodRes.json();
      const favJson = await favRes.json();
      const cartJson = await cartRes.json();
      if (prodJson.success) setProducts(prodJson.data.products ?? []);
      if (favJson.success) {
        setFavoriteIds(new Set(favJson.data.productIds ?? []));
        setFavorites(favJson.data.products ?? []);
      }
      if (cartJson.success) setCartCount(cartJson.data.cart?.items?.length ?? 0);
    } finally {
      setLoading(false);
    }
  }, [q, category, minPrice, maxPrice, inStock]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function addToCart(productId: string) {
    setFeedback("");
    const res = await fetch("/api/cart/items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const json = await res.json();
    if (json.success) {
      setFeedback("Produto adicionado ao carrinho.");
      setFeedbackType("success");
      setCartCount((c) => c + 1);
    } else {
      setFeedback(json.error?.message ?? "Erro ao adicionar ao carrinho.");
      setFeedbackType("error");
    }
  }

  async function toggleFavorite(productId: string) {
    const res = await fetch("/api/client/favorites", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const json = await res.json();
    if (json.success) {
      await load();
      setFeedback(json.data.favorited ? "Favorito salvo." : "Favorito removido.");
      setFeedbackType("success");
    }
  }

  const displayProducts = tab === "favorites" ? favorites : products;

  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Marketplace"
        description="Produtos de parceiros aprovados. Carrinho e pedidos vinculados à sua conta."
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link href="/carrinho">
              <ShoppingCart className="h-4 w-4" />
              Carrinho ({cartCount})
            </Link>
          </Button>
        }
      />

      <div className="flex gap-2">
        {(["all", "favorites"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === key
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {key === "all" ? "Catálogo" : `Salvos (${favorites.length})`}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <>
          <PublicSearchBar value={q} onChange={setQ} placeholder="Buscar produtos..." />
          <PublicMarketplaceFilters
            category={category}
            onCategoryChange={setCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            inStock={inStock}
            onInStockChange={setInStock}
          />
        </>
      )}

      <ClientFeedback message={feedback} type={feedbackType} />

      {loading ? (
        <ClientGridSkeleton />
      ) : displayProducts.length === 0 ? (
        <ClientEmptyState
          icon={Package}
          title={tab === "favorites" ? "Nenhum favorito" : "Nenhum produto"}
          description={
            tab === "favorites"
              ? "Favorite produtos no catálogo para vê-los aqui."
              : "Não há produtos disponíveis com os filtros atuais."
          }
          actionLabel={tab === "favorites" ? "Ver catálogo" : undefined}
          onAction={tab === "favorites" ? () => setTab("all") : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayProducts.map((product) => {
            const img = firstProductImageUrl(product.images as string[] | undefined);
            const isFav = favoriteIds.has(product.id);
            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-10 w-10 text-zinc-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-lg font-semibold">{formatPrice(product.price)}</p>
                  <p className="text-xs text-zinc-500">
                    {product.seller?.partnerProfile?.businessName ?? "Parceiro EcoPet"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/marketplace/produto/${product.id}`}>Ver produto</Link>
                    </Button>
                    <Button size="sm" onClick={() => addToCart(product.id)}>
                      <ShoppingCart className="mr-1 h-4 w-4" />
                      Carrinho
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(product.id)}
                      aria-label="Favoritar"
                    >
                      <Heart className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
