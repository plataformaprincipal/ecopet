"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { SocialSubNav } from "@/components/social/social-sub-nav";
import { Card, CardContent } from "@/components/ui/card";
import { fetchTrends } from "@/lib/social/api";
import { fetchSavedPosts } from "@/lib/social/api";
import type { TrendTag } from "@/lib/social/types";
import type { SocialPost } from "@/lib/social/types";
import { useSocialStore } from "@/store/social-store";
import { formatCount } from "@/lib/social/config";

export function TrendsPageContent() {
  const [trends, setTrends] = useState<TrendTag[]>([]);

  useEffect(() => {
    fetchTrends().then(setTrends);
  }, []);

  return (
    <>
      <AppHeader title="Tendências" />
      <SocialSubNav />
      <main className="mx-auto max-w-2xl flex-1 p-4 lg:p-6">
        <Card className="mb-6 overflow-hidden border-ecopet-green/20 bg-gradient-to-r from-ecopet-green/5 to-ecopet-yellow/5">
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-ecopet-green" />
            <div>
              <p className="font-display font-bold text-ecopet-dark dark:text-white">Tendências ECOPET</p>
              <p className="text-sm text-ecopet-gray">Hashtags e temas em alta na comunidade pet</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {trends.map((t, i) => (
            <Link key={t.tag} href={`/social/explorar`}>
              <Card className="mb-2 transition hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="font-display text-2xl font-bold text-ecopet-green/40">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-bold text-ecopet-green">{t.tag}</p>
                    <p className="text-sm text-ecopet-gray">{formatCount(t.posts)} posts · {t.category}</p>
                  </div>
                  <span className="rounded-full bg-ecopet-green/10 px-3 py-1 text-xs font-semibold text-ecopet-green">{t.growth}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export function SavedPageContent() {
  const savedArray = useSocialStore((s) => [...s.savedIds]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedPosts(savedArray).then(setPosts).finally(() => setLoading(false));
  }, [savedArray.join(",")]);

  return (
    <>
      <AppHeader title="Salvos" />
      <SocialSubNav />
      <main className="mx-auto max-w-2xl flex-1 p-4 lg:p-6">
        {loading ? (
          <p className="text-center text-ecopet-gray">Carregando...</p>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Bookmark className="h-12 w-12 text-ecopet-gray/40" />
              <p className="mt-4 font-semibold">Nenhum post salvo</p>
              <p className="text-sm text-ecopet-gray">Salve posts do feed para ver aqui</p>
              <Link href="/feed" className="mt-4 text-sm text-ecopet-green hover:underline">Ir ao feed</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/social/post/${post.id}`} className="relative aspect-square overflow-hidden rounded-xl">
                {post.media[0] && <Image src={post.media[0].url} alt="" fill className="object-cover" />}
                <div className="absolute inset-0 bg-black/20" />
                <p className="absolute bottom-2 left-2 right-2 truncate text-xs font-semibold text-white">{post.author.name}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
