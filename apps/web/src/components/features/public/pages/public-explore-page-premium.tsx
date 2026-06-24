"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Hash,
  Heart,
  Package,
  Scissors,
  ShoppingBag,
  Store,
  Stethoscope,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { SearchBar } from "../search-bar";
import { CategoryChips } from "../category-chips";
import { EmptyStatePremium } from "../empty-state-premium";
import { ExploreMasonryGrid } from "../explore-masonry-grid";
import { SkeletonGrid } from "../skeleton-card";
import { fetchPublicExplore, fetchPublicTrending } from "@/lib/public/client-api";
import type { PublicTrendingData } from "@/lib/public/client-api";
import type { PublicCategoryItem } from "@/components/features/public-client/public-category-grid";

type ExploreData = {
  counts: { products: number; services: number; partners: number; adoptions: number };
  products: Array<{ id: string; name: string; price: number; catalogCategory?: string | null }>;
  services: Array<{ id: string; name: string; price: number; category: string }>;
  partners: Array<{ id: string; name: string; category?: string | null; city?: string | null; productCount?: number; serviceCount?: number }>;
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PublicExplorePagePremium() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [data, setData] = useState<ExploreData | null>(null);
  const [trending, setTrending] = useState<PublicTrendingData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [explore, trend] = await Promise.all([
        fetchPublicExplore({ q: query || undefined, category: category || undefined }),
        fetchPublicTrending().catch(() => null),
      ]);
      setData(explore);
      setTrending(trend);
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const categories = useMemo(
    () => [
      { id: "pet-shops", label: "Pet shops", icon: Store },
      { id: "banho-tosa", label: "Banho e tosa", icon: Scissors },
      { id: "veterinarios", label: "Veterinários", icon: Stethoscope },
      { id: "adocao", label: "Adoção", icon: Heart },
      { id: "produtos", label: "Produtos", icon: Package },
      { id: "servicos", label: "Serviços", icon: Wrench },
    ],
    []
  );

  const hasResults =
    (data?.products.length ?? 0) + (data?.services.length ?? 0) + (data?.partners.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">Explorar</h1>
        <p className="max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          Descubra o que está acontecendo no ecossistema pet — tendências, parceiros, produtos e adoção.
        </p>
      </header>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Buscar produtos, serviços, ONGs, hashtags..."
        aria-label="Buscar no ecossistema EcoPet"
      />

      <CategoryChips
        items={categories}
        activeId={category}
        onSelect={(id) => setCategory((prev) => (prev === id ? "" : id))}
      />

      {trending ? (
        <section aria-labelledby="trending-title" className="space-y-4">
          <h2 id="trending-title" className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-ecopet-green" aria-hidden />
            Tendências
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {trending.hashtags.slice(0, 8).map((h) => (
              <Link
                key={h.slug}
                href={`/feed/hashtag/${h.slug}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-[20px] border border-zinc-200/80 bg-white px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <Hash className="h-4 w-4 text-ecopet-green" aria-hidden />
                {h.name}
                <span className="text-xs text-zinc-400">{h.usageCount}</span>
              </Link>
            ))}
          </div>
          {trending.ngos.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trending.ngos.map((ngo) => (
                <div
                  key={ngo.id}
                  className="rounded-[20px] border border-zinc-200/80 bg-gradient-to-br from-white to-ecopet-cream/40 p-4 dark:border-white/10 dark:from-zinc-900/60"
                >
                  <Heart className="h-5 w-5 text-ecopet-green" aria-hidden />
                  <p className="mt-2 font-medium">{ngo.name}</p>
                  {ngo.city ? <p className="text-xs text-zinc-500">{ngo.city}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {loading ? (
        <SkeletonGrid count={6} />
      ) : !hasResults ? (
        <EmptyStatePremium
          icon={ShoppingBag}
          title="Nenhum resultado encontrado"
          description="Não há itens públicos para os filtros selecionados. Tente outra busca ou explore o marketplace."
          actionLabel="Ver marketplace"
          actionHref="/marketplace"
        />
      ) : (
        <ExploreMasonryGrid
          partners={data?.partners ?? []}
          services={data?.services ?? []}
          products={data?.products ?? []}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
}
