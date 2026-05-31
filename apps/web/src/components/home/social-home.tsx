"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { StoriesBar } from "@/components/social/stories-bar";
import { AiSuggestionsBlock, AiCommunityBlock } from "@/components/social/ai-blocks";
import { FeedPostCard } from "@/components/social/feed-post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocialStore } from "@/store/social-store";

export function SocialHome() {
  const posts = useSocialStore((s) => s.posts);
  const stories = useSocialStore((s) => s.stories);
  const loading = useSocialStore((s) => s.loading);
  const loaded = useSocialStore((s) => s.loaded);
  const loadFeed = useSocialStore((s) => s.loadFeed);
  const loadStories = useSocialStore((s) => s.loadStories);

  useEffect(() => {
    if (!loaded) loadFeed();
    loadStories();
  }, [loaded, loadFeed, loadStories]);

  return (
    <>
      <AppHeader title="ECOPET" />
      <main className="mx-auto max-w-2xl flex-1 pb-4">
        {!loading && stories.length > 0 && (
          <div className="border-b border-ecopet-gray/10 px-4 py-3">
            <StoriesBar stories={stories} />
          </div>
        )}

        <div className="space-y-4 p-4">
          {/* IA ECOPET recomenda */}
          {!loading && (
            <>
              <Card className="overflow-hidden border-ecopet-green/20 bg-gradient-to-br from-ecopet-green/5 to-violet-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-ecopet-yellow" />
                    <h2 className="font-display text-sm font-bold">IA ECOPET recomenda</h2>
                    <Badge variant="premium">Personalizado</Badge>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { label: "Seguir @VetCare", href: "/social/perfil/mp2" },
                      { label: "Ração para Luna", href: "/marketplace/produto/prod1" },
                      { label: "Banho perto de você", href: "/marketplace/servico/srv1" },
                      { label: "Adoção SP", href: "/adocao" },
                      { label: "#GoldenRetriever", href: "/social/tendencias" },
                    ].map((item) => (
                      <Link key={item.label} href={item.href} className="shrink-0 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-ecopet-green/10 dark:bg-white/10">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Link href="/social/tendencias" className="flex items-center gap-2 rounded-xl border border-ecopet-gray/10 px-4 py-3 text-sm hover:bg-ecopet-green/5">
                <TrendingUp className="h-4 w-4 text-ecopet-green" />
                <span className="font-semibold">Tendências pet</span>
                <span className="text-ecopet-gray">#GoldenRetriever · #SaudePet · #AdocaoSP</span>
              </Link>

              <AiSuggestionsBlock />
              <AiCommunityBlock />
            </>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <Skeleton className="aspect-square w-full rounded-2xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-ecopet-gray">
                Nenhum post no feed. Siga perfis para ver conteúdo!
              </CardContent>
            </Card>
          ) : (
            posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <FeedPostCard post={post} />
              </motion.div>
            ))
          )}
        </div>

        <Link
          href="/feed"
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ecopet-green text-white shadow-lg transition-transform hover:scale-105 lg:bottom-8"
          aria-label="Criar publicação"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </main>
    </>
  );
}
