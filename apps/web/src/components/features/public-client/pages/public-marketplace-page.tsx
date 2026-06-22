"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicPageHeader } from "../public-page-header";
import { PublicSearchBar } from "../public-search-bar";
import {
  PublicMarketplaceFilters,
  PublicMarketplaceGrid,
  type PublicMarketplaceItem,
} from "../public-marketplace-grid";
import { PublicGridSkeleton } from "../public-skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicMarketplacePage() {
  const [products, setProducts] = useState<PublicMarketplaceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(true);

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
      const res = await fetch(`/api/public/products?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products ?? []);
        setTotal(json.data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [q, category, minPrice, maxPrice, inStock]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="space-y-6">
      <PublicPageHeader
        title="Marketplace"
        description="Catálogo público de produtos da plataforma e de parceiros aprovados. Entre para finalizar compras."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/carrinho">Ver carrinho</Link>
          </Button>
        }
      />

      <PublicSearchBar
        value={q}
        onChange={setQ}
        placeholder="Buscar produtos..."
        aria-label="Buscar produtos no marketplace"
      />

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

      <p className="text-sm text-zinc-500" aria-live="polite">
        {loading ? "Carregando..." : `${total} produto(s) encontrado(s)`}
      </p>

      {loading ? <PublicGridSkeleton count={6} /> : <PublicMarketplaceGrid products={products} />}
    </div>
  );
}
