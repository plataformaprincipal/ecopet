"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostComposer } from "@/components/features/social/feed/post-composer";
import { PostCard } from "@/components/features/social/feed/post-card";
import { SkeletonCard } from "@/components/features/public/skeleton-card";
import { EmptyStatePremium } from "@/components/features/public/empty-state-premium";
import { fetchFeed, type ApiSocialPost } from "@/lib/social/client-api";
import { fetchPublicPosts } from "@/lib/public/client-api";
import { useAssistantStore } from "@/store/assistant-store";

type HubFilter = {
  id: string;
  label: string;
  type?: string;
  sort?: "popular";
};

const HUB_FILTERS: HubFilter[] = [
  { id: "for-you", label: "Para Você" },
  { id: "following", label: "Seguindo" },
  { id: "recent", label: "Mais Recentes" },
  { id: "popular", label: "Populares", sort: "popular" },
  { id: "adoption", label: "Adoção", type: "ADOPTION" },
  { id: "health", label: "Saúde", type: "EDUCATIONAL" },
  { id: "food", label: "Alimentação", type: "GENERAL" },
  { id: "services", label: "Serviços", type: "SERVICE" },
  { id: "marketplace", label: "Marketplace", type: "PRODUCT" },
];

export function HubFeed() {
  const [active, setActive] = useState<HubFilter>(HUB_FILTERS[0]);
  const [posts, setPosts] = useState<ApiSocialPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ask = useAssistantStore((s) => s.ask);

  const load = useCallback(
    async (filter: HubFilter, reset = false) => {
      setLoading(true);
      setError(null);
      try {
        if (filter.sort === "popular") {
          const data = await fetchPublicPosts({
            cursor: reset ? undefined : cursor ?? undefined,
            sort: "popular",
          });
          setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
          setCursor(data.nextCursor);
        } else {
          const data = await fetchFeed({
            cursor: reset ? undefined : cursor ?? undefined,
            type: filter.type,
          });
          setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
          setCursor(data.nextCursor);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar o feed.");
      } finally {
        setLoading(false);
      }
    },
    [cursor]
  );

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    void load(active, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.id]);

  function handleAskAi(post: ApiSocialPost) {
    const snippet = post.content?.slice(0, 280) ?? "";
    ask(`Resuma e comente este post da comunidade pet de forma útil: "${snippet}"`);
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">Comunidade Pet</h1>
        <p className="text-sm text-zinc-500">Compartilhe momentos, descubra histórias e conecte-se.</p>
      </header>

      <PostComposer onPublished={() => load(active, true)} />

      <div className="sticky top-16 z-10 -mx-1 flex gap-2 overflow-x-auto rounded-2xl bg-white/80 px-1 py-2 backdrop-blur-md dark:bg-zinc-900/70" role="tablist" aria-label="Filtros do feed">
        {HUB_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active.id === f.id}
            onClick={() => setActive(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              active.id === f.id
                ? "bg-ecopet-green text-white"
                : "border border-zinc-200/80 bg-white text-zinc-600 hover:border-ecopet-green/30 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={() => load(active, true)}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          <SkeletonCard variant="post" />
          <SkeletonCard variant="post" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyStatePremium
          icon={Users}
          title="Nenhuma publicação ainda"
          description="Seja o primeiro a compartilhar um momento do seu pet com a comunidade."
          actionLabel="Explorar"
          actionHref="/explorar"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={() => load(active, true)} onAskAi={handleAskAi} />
          ))}
          {cursor ? (
            <Button variant="outline" className="w-full rounded-xl" disabled={loading} onClick={() => load(active, false)}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              {loading ? "Carregando..." : "Carregar mais"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
