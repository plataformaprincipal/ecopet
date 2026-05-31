"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Sparkles, SlidersHorizontal, MapPin, Star } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EXPLORE_CATEGORIES, EXPLORE_TRENDS, EXPLORE_FEATURED_PETS, EXPLORE_NEARBY } from "@/lib/explore/config";
import { fetchExploreSections } from "@/lib/social/api";
import type { ExploreSection } from "@/lib/social/types";

export function ExplorePage() {
  const [sections, setSections] = useState<ExploreSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("São Paulo, SP");

  useEffect(() => {
    fetchExploreSections().then(setSections).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AppHeader title="Explorar" />
      <main className="mx-auto max-w-4xl flex-1 p-4 lg:p-6">
        {/* Busca global */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ecopet-gray" />
          <Input
            placeholder="Buscar pets, serviços, produtos, veterinários..."
            className="h-12 pl-11 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} className="max-w-[200px]" />
          <Button variant="outline" size="sm"><SlidersHorizontal className="h-4 w-4" /> Filtros</Button>
          <Link href="/ia">
            <Button size="sm">
              <Sparkles className="h-4 w-4" /> Explorar com IA
            </Button>
          </Link>
        </div>

        {/* Categorias */}
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-bold">Categorias</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {EXPLORE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.href}
                className="flex flex-col items-center gap-1 rounded-2xl border border-ecopet-gray/10 bg-white p-3 text-center transition-all hover:border-ecopet-green/30 hover:shadow-md dark:bg-white/5"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-semibold">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Tendências */}
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-bold">Tendências do momento</h2>
          <div className="flex flex-wrap gap-2">
            {EXPLORE_TRENDS.map((t) => (
              <Link key={t.tag} href={`/social/tendencias`}>
                <Badge variant="default" className="px-4 py-2 text-sm hover:bg-ecopet-green/20">
                  {t.tag} <span className="ml-1 opacity-60">{t.posts}</span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>

        {/* Pets em destaque */}
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-bold">Pets em destaque</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {EXPLORE_FEATURED_PETS.map((pet) => (
              <Link key={pet.id} href={`/social/perfil/${pet.id}`} className="shrink-0 w-28">
                <div className="relative aspect-square overflow-hidden rounded-2xl">
                  <Image src={pet.image} alt={pet.name} fill className="object-cover" />
                </div>
                <p className="mt-1 text-sm font-semibold">{pet.name}</p>
                <p className="text-xs text-ecopet-gray">{pet.followers} seguidores</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Próximos / recomendados */}
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-bold">Próximos de você</h2>
          <div className="space-y-2">
            {EXPLORE_NEARBY.map((item) => (
              <Link key={item.id} href={item.href}>
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <Badge variant="default" className="mb-1 text-[10px]">{item.type}</Badge>
                      <p className="font-semibold">{item.name}</p>
                      <p className="flex items-center gap-1 text-xs text-ecopet-gray">
                        <MapPin className="h-3 w-3" /> {item.distance}
                        <Star className="ml-2 h-3 w-3 fill-ecopet-yellow text-ecopet-yellow" /> {item.rating}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Seções dinâmicas do social API */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.id} className="mb-8">
              <h2 className="mb-4 font-display text-lg font-bold">{section.title}</h2>
              {section.type === "grid" && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {section.items.map((item) => (
                    <Link key={item.id} href={item.href} className="group relative aspect-square overflow-hidden rounded-2xl">
                      {item.image && <Image src={item.image} alt="" fill className="object-cover transition group-hover:scale-105" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <p className="text-sm font-semibold">{item.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </main>
    </>
  );
}
