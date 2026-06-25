"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Megaphone, Users, Loader2 } from "lucide-react";
import { PostComposer } from "@/components/features/social/feed/post-composer";
import { PostCard } from "@/components/features/social/feed/post-card";
import { StoriesRail } from "./stories-rail";
import { SkeletonCard } from "@/components/features/public/skeleton-card";
import { EmptyStatePremium } from "@/components/features/public/empty-state-premium";
import { fetchFeed, type ApiSocialPost } from "@/lib/social/client-api";
import { fetchPublicPosts } from "@/lib/public/client-api";
import { useAssistantStore } from "@/store/assistant-store";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import type { TranslateFn } from "@/lib/i18n";
import { SOCIAL_FILTERS, type SocialFilterId } from "./filters";

function PinnedCampaign({ t }: { t: TranslateFn }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-ecopet-green/20 bg-gradient-to-br from-ecopet-green/10 via-white to-ecopet-yellow/10 p-5 shadow-sm dark:from-ecopet-green/20 dark:via-zinc-900 dark:to-ecopet-dark-card">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ecopet-green px-2.5 py-1 text-[11px] font-semibold text-white">
        <Megaphone className="h-3 w-3" aria-hidden />
        {t("social.feed.pinnedBadge")}
      </span>
      <h3 className="mt-3 font-display text-lg font-bold text-zinc-900 dark:text-white">
        {t("social.feed.pinnedTitle")}
      </h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        {t("social.feed.pinnedDesc")}
      </p>
      <Link
        href="/adocao"
        className="mt-4 inline-block rounded-xl bg-ecopet-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        {t("social.feed.pinnedCta")}
      </Link>
    </div>
  );
}

export function SocialFeedStream({ activeFilter }: { activeFilter: SocialFilterId }) {
  const { isAuthenticated } = useAuthGate();
  const { t } = useTranslation();
  const ask = useAssistantStore((s) => s.ask);
  const [posts, setPosts] = useState<ApiSocialPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filter = SOCIAL_FILTERS.find((f) => f.id === activeFilter) ?? SOCIAL_FILTERS[0];

  const load = useCallback(
    async (reset: boolean, cursorArg?: string | null) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const userPublicPopular = filter.sort === "popular" || !isAuthenticated;
        const data = userPublicPopular
          ? await fetchPublicPosts({
              cursor: reset ? undefined : cursorArg ?? undefined,
              type: filter.type,
              sort: filter.sort,
            })
          : await fetchFeed({ cursor: reset ? undefined : cursorArg ?? undefined, type: filter.type });
        setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
        setCursor(data.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("social.feed.error"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter.type, filter.sort, isAuthenticated, t]
  );

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, isAuthenticated]);

  // Infinite scroll
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && !loading) {
          void load(false, cursor);
        }
      },
      { rootMargin: "400px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [cursor, loadingMore, loading, load]);

  function handleAskAi(post: ApiSocialPost) {
    const snippet = post.content?.slice(0, 280) ?? "";
    ask(t("social.feed.askAi", { snippet }));
  }

  return (
    <div className="space-y-5">
      <StoriesRail />
      <PinnedCampaign t={t} />
      <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50">
        <PostComposer onPublished={() => load(true)} />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {loading && posts.length === 0 ? (
        <div className="space-y-5">
          <SkeletonCard variant="post" />
          <SkeletonCard variant="post" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyStatePremium
          icon={Users}
          title={t("social.feed.emptyTitle")}
          description={t("social.feed.emptyDesc")}
          actionLabel={t("social.feed.explore")}
          actionHref="/explorar"
        />
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={() => load(true)} onAskAi={handleAskAi} />
          ))}
          <div ref={sentinelRef} aria-hidden className="h-px" />
          {loadingMore ? (
            <div className="flex justify-center py-4 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            </div>
          ) : null}
          {!cursor ? <p className="py-4 text-center text-xs text-zinc-400">{t("social.feed.endOfFeed")}</p> : null}
        </div>
      )}
    </div>
  );
}
