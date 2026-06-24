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
import { PremiumExploreMasonry } from "@/components/features/public-premium/premium-explore-masonry";

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
        description="Descubra pets, eventos, parceiros e conteúdos — experiência inspirada em descoberta visual."
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
        <PremiumExploreMasonry
          partners={data?.partners ?? []}
          services={data?.services ?? []}
          products={data?.products ?? []}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
}
