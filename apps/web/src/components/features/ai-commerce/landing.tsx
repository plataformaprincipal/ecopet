"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";
import { AI_STORE_FILTERS, AI_STORE_GROUPS, type AiStoreGroup } from "@/lib/ai-commerce/catalog";

type CatalogProduct = {
  sku: string;
  slug: string;
  name: string;
  tag: string;
  category: string;
  group: AiStoreGroup;
  filters: string[];
  unitLabel: string;
  billingType: string;
  shortDescription: string;
  included: string[];
  href: string;
  priceInCents: number;
  commercialPending: boolean;
  purchasable: boolean;
};

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function EccoPetAiLanding() {
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [filter, setFilter] = useState<(typeof AI_STORE_FILTERS)[number]>("Todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    analyticsService.track(AiEvents.CATALOG_VIEW, { screen: "eccopet_store" });
    fetch("/api/ai-commerce/catalog")
      .then((r) => r.json())
      .then((d) => setProducts(d.success ? d.data.products : []))
      .catch(() => setProducts([]));
  }, []);

  const visible = useMemo(() => {
    const list = products ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (filter !== "Todos" && !p.filters.includes(filter) && p.category !== filter) return false;
      if (!q) return true;
      return `${p.name} ${p.tag} ${p.shortDescription} ${p.category}`.toLowerCase().includes(q);
    });
  }, [products, filter, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-medium tracking-wide text-ecopet-green">EccoPet AI</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ecopet-dark dark:text-white sm:text-5xl">
          Inteligência especializada para cuidar de quem faz parte da família.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Avaliações, análises visuais, exames, acompanhamento e relatórios personalizados com inteligência
          artificial especializada em pets.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href="#solucoes">Explorar soluções</a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/minha-conta/ia">Meus serviços</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Resultados automatizados e orientativos. Quando necessário, procure um médico-veterinário.
        </p>
      </header>

      <section id="solucoes" className="mt-14">
        <label className="block text-sm font-medium" htmlFor="ai-search">
          Do que seu pet precisa?
        </label>
        <input
          id="ai-search"
          className="mt-2 w-full max-w-xl rounded-xl border bg-transparent px-4 py-3"
          placeholder="Ex.: peso, vacina, exame, pele…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {AI_STORE_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`rounded-full border px-3 py-1 text-sm ${filter === f ? "border-ecopet-green bg-ecopet-green/10" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {!products && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {AI_STORE_GROUPS.map((group) => {
        const items = visible.filter((p) => p.group === group.id);
        if (!items.length) return null;
        return (
          <section key={group.id} className="mt-14">
            <h2 className="text-2xl font-semibold">{group.label}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {items.map((p) => (
                <article
                  key={p.sku}
                  className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-[var(--shadow-sm)] dark:border-white/10 dark:bg-ecopet-dark"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-ecopet-green">{p.tag}</p>
                  <h3 className="mt-2 text-xl font-semibold">{p.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.shortDescription}</p>
                  <p className="mt-4 text-lg font-semibold">
                    {formatPrice(p.priceInCents)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">{p.unitLabel}</span>
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {p.included.slice(0, 4).map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild className="flex-1">
                      <Link href={p.href}>{p.billingType === "SUBSCRIPTION" ? "Comprar plano de 30 dias" : "Comprar agora"}</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={p.href}>Conhecer</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Como funciona</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            ["1", "Escolha", "Selecione a solução e o pet."],
            ["2", "Compre", "Pagamento seguro via Mercado Pago."],
            ["3", "Use", "Envie dados, imagens ou documentos."],
            ["4", "Receba", "Resultado, PDF, planilha e histórico."],
          ].map(([n, t, d]) => (
            <li key={n} className="rounded-2xl border border-black/5 p-5 dark:border-white/10">
              <span className="text-sm font-medium text-ecopet-green">{n}</span>
              <h3 className="mt-2 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
