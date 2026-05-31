"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { SocialSubNav } from "@/components/social/social-sub-nav";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchExploreSections } from "@/lib/social/api";
import type { ExploreSection } from "@/lib/social/types";
import { AiSuggestionsBlock } from "@/components/social/ai-blocks";

export function ExplorePageContent() {
  const [sections, setSections] = useState<ExploreSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchExploreSections().then(setSections).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AppHeader title="Explorar" />
      <SocialSubNav />
      <main className="mx-auto max-w-4xl flex-1 p-4 lg:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecopet-gray" />
          <Input placeholder="Buscar pets, hashtags, serviços..." className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="mb-6">
          <AiSuggestionsBlock />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.id} className="mb-8">
              <h2 className="mb-4 font-display text-lg font-bold text-ecopet-dark dark:text-white">{section.title}</h2>

              {section.type === "grid" && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {section.items.map((item) => (
                    <Link key={item.id} href={item.href} className="group relative aspect-square overflow-hidden rounded-2xl">
                      {item.image && <Image src={item.image} alt="" fill className="object-cover transition group-hover:scale-105" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <p className="text-sm font-semibold">{item.title}</p>
                        {item.subtitle && <p className="text-xs opacity-80">{item.subtitle}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {section.type === "hashtags" && (
                <div className="flex flex-wrap gap-2">
                  {section.items.map((item) => (
                    <Link key={item.id} href={item.href}>
                      <Badge variant="default" className="px-4 py-2 text-sm hover:bg-ecopet-green/20">
                        {item.title}
                        {item.subtitle && <span className="ml-2 font-normal opacity-70">{item.subtitle}</span>}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {section.type === "list" && (
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <Link key={item.id} href={item.href}>
                      <Card className="transition hover:shadow-md">
                        <CardContent className="flex items-center gap-3 p-3">
                          {item.image && (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                              <Image src={item.image} alt="" fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">{item.title} {item.badge}</p>
                            {item.subtitle && <p className="text-xs text-ecopet-gray">{item.subtitle}</p>}
                          </div>
                        </CardContent>
                      </Card>
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
