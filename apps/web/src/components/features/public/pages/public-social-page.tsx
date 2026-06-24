"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Hash, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryChips } from "../category-chips";
import { EmptyStatePremium } from "../empty-state-premium";
import { PublicPostCard } from "../public-post-card";
import { SkeletonCard } from "../skeleton-card";
import { fetchPublicPosts, fetchPublicTrending } from "@/lib/public/client-api";
import type { ApiSocialPost } from "@/lib/social/client-api";
import { useSession } from "next-auth/react";
import { SocialFeed } from "@/components/features/social/feed/social-feed";

const FEED_CATEGORIES = [
  { id: "", label: "Para você" },
  { id: "popular", label: "Populares" },
  { id: "ADOPTION", label: "Adoção" },
  { id: "EDUCATIONAL", label: "Saúde" },
  { id: "GENERAL", label: "Alimentação" },
  { id: "PET_UPDATE", label: "Passeios" },
  { id: "PRODUCT", label: "Antes e depois" },
  { id: "URGENT", label: "Perdidos e encontrados" },
];

function TrendingSidebar({ hashtags }: { hashtags: Array<{ name: string; slug: string; usageCount: number }> }) {
  return (
    <aside className="hidden space-y-4 xl:block" aria-label="Tendências">
      <div className="rounded-[20px] border border-zinc-200/80 bg-white/80 p-5 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60">
        <h2 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
          <TrendingUp className="h-5 w-5 text-ecopet-green" aria-hidden />
          Em alta
        </h2>
        <ul className="mt-4 space-y-3">
          {hashtags.length === 0 ? (
            <li className="text-sm text-zinc-500">Nenhuma hashtag ainda.</li>
          ) : (
            hashtags.map((h) => (
              <li key={h.slug}>
                <Link
                  href={`/feed/hashtag/${h.slug}`}
                  className="flex items-center justify-between text-sm hover:text-ecopet-green"
                >
                  <span className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5" aria-hidden />
                    {h.name}
                  </span>
                  <span className="text-xs text-zinc-400">{h.usageCount}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="rounded-[20px] bg-gradient-to-br from-ecopet-green to-emerald-700 p-5 text-white">
        <Users className="h-8 w-8 text-ecopet-yellow" aria-hidden />
        <h3 className="mt-3 font-semibold">Faça parte da comunidade</h3>
        <p className="mt-2 text-sm text-white/85">Publique, siga tutores e compartilhe momentos do seu pet.</p>
        <Button asChild size="sm" className="mt-4 rounded-xl bg-white text-ecopet-dark hover:bg-ecopet-cream">
          <Link href="/cadastro">Criar conta grátis</Link>
        </Button>
      </div>
    </aside>
  );
}

function CategoriesSidebar({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="hidden space-y-2 lg:block" aria-label="Categorias do feed">
      <div className="rounded-[20px] border border-zinc-200/80 bg-white/80 p-4 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
          <Flame className="h-5 w-5 text-ecopet-yellow" aria-hidden />
          Categorias
        </h2>
        <nav className="space-y-1">
          {FEED_CATEGORIES.map((cat) => (
            <button
              key={cat.id || "all"}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                activeId === cat.id
                  ? "bg-ecopet-green/10 font-medium text-ecopet-green"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function GuestSocialFeed() {
  const [category, setCategory] = useState("");
  const [posts, setPosts] = useState<ApiSocialPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hashtags, setHashtags] = useState<Array<{ name: string; slug: string; usageCount: number }>>([]);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const isPopular = category === "popular";
        const type = category && category !== "popular" ? category : undefined;
        const data = await fetchPublicPosts({
          cursor: reset ? undefined : cursor ?? undefined,
          type,
          sort: isPopular ? "popular" : "recent",
        });
        setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
        setCursor(data.nextCursor);
      } finally {
        setLoading(false);
      }
    },
    [category, cursor]
  );

  useEffect(() => {
    fetchPublicTrending()
      .then((d) => setHashtags(d.hashtags))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_260px] xl:grid-cols-[240px_minmax(0,640px)_280px]">
      <CategoriesSidebar activeId={category} onSelect={setCategory} />

      <div className="min-w-0 space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">Comunidade Pet</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Histórias reais, adoções e dicas — explore a rede social do EcoPet.
          </p>
        </header>

        <CategoryChips
          items={FEED_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))}
          activeId={category}
          onSelect={setCategory}
          className="lg:hidden"
        />

        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            <SkeletonCard variant="post" />
            <SkeletonCard variant="post" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyStatePremium
            icon={Users}
            title="A comunidade está crescendo"
            description="Ainda não há posts públicos. Seja o primeiro a compartilhar a história do seu pet."
            actionLabel="Criar conta"
            actionHref="/cadastro"
          />
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PublicPostCard key={post.id} post={post} />
            ))}
            {cursor ? (
              <Button variant="outline" className="w-full rounded-xl" disabled={loading} onClick={() => load(false)}>
                {loading ? "Carregando..." : "Carregar mais"}
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <TrendingSidebar hashtags={hashtags} />
    </div>
  );
}

export function PublicSocialPage() {
  const { status } = useSession();
  if (status === "authenticated") {
    return (
      <div className="mx-auto max-w-2xl">
        <SocialFeed />
      </div>
    );
  }
  return <GuestSocialFeed />;
}
