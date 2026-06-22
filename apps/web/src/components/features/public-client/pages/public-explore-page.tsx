"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Package,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Store,
  Wrench,
} from "lucide-react";
import { PublicPageHeader } from "../public-page-header";
import { PublicSearchBar } from "../public-search-bar";
import { PublicCategoryGrid, type PublicCategoryItem } from "../public-category-grid";
import { PublicEmptyState } from "../public-empty-state";
import { PublicGridSkeleton } from "../public-skeleton";
import { Button } from "@/components/ui/button";

type ExploreData = {
  counts: { products: number; services: number; partners: number; adoptions: number };
  products: Array<{ id: string; name: string; price: number; catalogCategory?: string | null }>;
  services: Array<{ id: string; name: string; price: number; category: string; provider?: { partnerProfile?: { businessName?: string } } }>;
  partners: Array<{ id: string; name: string; category?: string | null; city?: string | null; productCount: number; serviceCount: number }>;
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PublicExplorePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [data, setData] = useState<ExploreData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      const res = await fetch(`/api/public/explore?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const categories: PublicCategoryItem[] = useMemo(
    () => [
      {
        id: "pet-shops",
        label: "Pet shops",
        description: "Lojas parceiras",
        href: "/explorar?category=pet-shops",
        icon: Store,
        count: data?.counts.partners,
      },
      {
        id: "banho-tosa",
        label: "Banho e tosa",
        description: "Serviços de estética",
        href: "/explorar?category=banho-tosa",
        icon: Scissors,
        count: data?.counts.services,
      },
      {
        id: "veterinarios",
        label: "Veterinários",
        description: "Consultas e saúde",
        href: "/explorar?category=veterinarios",
        icon: Stethoscope,
      },
      {
        id: "adocao",
        label: "Adoção",
        description: "ONGs verificadas",
        href: "/cadastro?callbackUrl=%2Fadocao",
        icon: Heart,
        count: data?.counts.adoptions,
      },
      {
        id: "produtos",
        label: "Produtos",
        description: "Catálogo público",
        href: "/marketplace",
        icon: Package,
        count: data?.counts.products,
      },
      {
        id: "servicos",
        label: "Serviços",
        description: "Agendáveis",
        href: "/servicos",
        icon: Wrench,
        count: data?.counts.services,
      },
    ],
    [data?.counts]
  );

  const hasResults =
    (data?.products.length ?? 0) +
      (data?.services.length ?? 0) +
      (data?.partners.length ?? 0) >
    0;

  return (
    <div className="space-y-8">
      <PublicPageHeader
        title="Explorar"
        description="Descubra pet shops, serviços, produtos e parceiros verificados do ecossistema EcoPet."
      />

      <PublicSearchBar
        value={query}
        onChange={setQuery}
        placeholder="Buscar produtos, serviços, lojas..."
        aria-label="Buscar no ecossistema EcoPet"
      />

      <PublicCategoryGrid
        items={categories}
        activeId={category}
        onSelect={(id) => setCategory((prev) => (prev === id ? "" : id))}
      />

      {loading ? (
        <PublicGridSkeleton />
      ) : !hasResults ? (
        <PublicEmptyState
          icon={ShoppingBag}
          title="Nenhum resultado encontrado"
          description="Não há itens públicos para os filtros selecionados. Tente outra busca ou explore o marketplace."
          actionLabel="Ver marketplace"
          actionHref="/marketplace"
        />
      ) : (
        <div className="space-y-10">
          {(data?.partners.length ?? 0) > 0 ? (
            <section aria-labelledby="parceiros-heading">
              <h2 id="parceiros-heading" className="text-lg font-semibold text-zinc-900 dark:text-white">
                Parceiros
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data!.partners.map((p) => (
                  <Link
                    key={p.id}
                    href={`/parceiros/${p.id}`}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
                  >
                    <p className="font-medium text-zinc-900 dark:text-white">{p.name}</p>
                    <p className="text-sm text-zinc-500">
                      {p.category ?? "Parceiro"}
                      {p.city ? ` · ${p.city}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {p.productCount} produtos · {p.serviceCount} serviços
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {(data?.services.length ?? 0) > 0 ? (
            <section aria-labelledby="servicos-heading">
              <div className="flex items-center justify-between gap-3">
                <h2 id="servicos-heading" className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Serviços
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/servicos">Ver todos</Link>
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.services.map((s) => (
                  <Link
                    key={s.id}
                    href={`/marketplace/servico/${s.id}`}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
                  >
                    <p className="font-medium text-zinc-900 dark:text-white">{s.name}</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">{formatPrice(s.price)}</p>
                    <p className="text-xs text-zinc-500">
                      {s.provider?.partnerProfile?.businessName ?? s.category}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {(data?.products.length ?? 0) > 0 ? (
            <section aria-labelledby="produtos-heading">
              <div className="flex items-center justify-between gap-3">
                <h2 id="produtos-heading" className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Produtos
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/marketplace">Ver todos</Link>
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/marketplace/produto/${p.id}`}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
                  >
                    <p className="font-medium text-zinc-900 dark:text-white">{p.name}</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">{formatPrice(p.price)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
