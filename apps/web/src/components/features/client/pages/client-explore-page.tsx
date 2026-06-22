"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { PublicSearchBar } from "@/components/features/public-client/public-search-bar";
import { PublicCategoryGrid, type PublicCategoryItem } from "@/components/features/public-client/public-category-grid";
import { ClientEmptyState } from "../client-empty-state";
import { ClientGridSkeleton } from "../client-skeleton";
import { ClientFeedback } from "../client-stats-cards";
import {
  Package,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Store,
  Wrench,
} from "lucide-react";

type ExploreData = {
  counts: { products: number; services: number; partners: number; adoptions: number };
  products: Array<{ id: string; name: string; price: number; rating?: number }>;
  services: Array<{ id: string; name: string; price: number; rating?: number; provider?: { id: string; partnerProfile?: { businessName?: string } } }>;
  partners: Array<{ id: string; name: string; category?: string | null; city?: string | null }>;
};

function formatPrice(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ClientExplorePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [data, setData] = useState<ExploreData | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      const [exploreRes, favRes] = await Promise.all([
        fetch(`/api/public/explore?${params}`, { credentials: "include" }),
        fetch("/api/client/favorites", { credentials: "include" }),
      ]);
      const exploreJson = await exploreRes.json();
      const favJson = await favRes.json();
      if (exploreJson.success) setData(exploreJson.data);
      if (favJson.success) setFavoriteIds(new Set(favJson.data.productIds ?? []));
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function toggleFavorite(productId: string) {
    setFeedback("");
    const res = await fetch("/api/client/favorites", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const json = await res.json();
    if (json.success) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (json.data.favorited) next.add(productId);
        else next.delete(productId);
        return next;
      });
      setFeedback(json.data.favorited ? "Adicionado aos favoritos." : "Removido dos favoritos.");
    } else {
      setFeedback(json.error?.message ?? "Erro ao favoritar.");
    }
  }

  const categories: PublicCategoryItem[] = useMemo(
    () => [
      { id: "pet-shops", label: "Pet shops", href: "#", icon: Store, count: data?.counts.partners },
      { id: "banho-tosa", label: "Banho e tosa", href: "#", icon: Scissors, count: data?.counts.services },
      { id: "veterinarios", label: "Veterinários", href: "#", icon: Stethoscope },
      { id: "adocao", label: "Adoção", href: "/adocao", icon: Heart, count: data?.counts.adoptions },
      { id: "produtos", label: "Produtos", href: "/cliente/marketplace", icon: Package, count: data?.counts.products },
      { id: "servicos", label: "Serviços", href: "/servicos", icon: Wrench, count: data?.counts.services },
    ],
    [data?.counts]
  );

  const hasResults =
    (data?.products.length ?? 0) + (data?.services.length ?? 0) + (data?.partners.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      <ClientPageHeader
        title="Explorar"
        description="Parceiros, serviços, produtos e ONGs verificados. Favorite produtos e inicie conversas."
      />

      <PublicSearchBar value={query} onChange={setQuery} placeholder="Buscar no ecossistema..." />
      <ClientFeedback message={feedback} />

      <PublicCategoryGrid items={categories} activeId={category} onSelect={setCategory} />

      {loading ? (
        <ClientGridSkeleton />
      ) : !hasResults ? (
        <ClientEmptyState
          icon={ShoppingBag}
          title="Nenhum resultado"
          description="Ajuste os filtros ou tente outra busca."
          actionLabel="Ver marketplace"
          actionHref="/cliente/marketplace"
        />
      ) : (
        <div className="space-y-10">
          {(data?.partners.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Parceiros aprovados</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data!.partners.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-zinc-500">{p.category}{p.city ? ` · ${p.city}` : ""}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/parceiros/${p.id}`}>Ver loja</Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/dashboard/messages?partner=${p.id}`}>
                          <MessageCircle className="mr-1 h-4 w-4" />
                          Mensagem
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(data?.services.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Serviços</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.services.map((s) => (
                  <Link
                    key={s.id}
                    href={`/marketplace/servico/${s.id}`}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="text-emerald-700">{formatPrice(s.price)}</p>
                    {s.rating ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {s.rating.toFixed(1)}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(data?.products.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Produtos</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.products.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
                  >
                    <p className="font-medium">{p.name}</p>
                    <p className="text-emerald-700">{formatPrice(p.price)}</p>
                    <div className="mt-3 flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/marketplace/produto/${p.id}`}>Ver</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant={favoriteIds.has(p.id) ? "default" : "ghost"}
                        onClick={() => toggleFavorite(p.id)}
                        aria-label={favoriteIds.has(p.id) ? "Remover favorito" : "Favoritar"}
                      >
                        <Heart className={`h-4 w-4 ${favoriteIds.has(p.id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
