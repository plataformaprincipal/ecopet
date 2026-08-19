"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { PostComposer } from "@/components/features/social/feed/post-composer";
import { PostCard } from "@/components/features/social/feed/post-card";
import { StoriesRail } from "./stories-rail";
import { SkeletonCard } from "@/components/features/public/skeleton-card";
import { EmptyStatePremium } from "@/components/features/public/empty-state-premium";
import { fetchFeed, type ApiSocialPost } from "@/lib/social/client-api";
import { fetchPublicPosts } from "@/lib/public/client-api";
import { useAssistantStore } from "@/store/assistant-store";
import { useFeedPreferencesStore } from "@/store/feed-preferences-store";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { SOCIAL_FILTERS, type SocialFilterId } from "./filters";

export function scrollToComposer() {
  document.getElementById("social-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function SocialFeedStream({ activeFilter }: { activeFilter: SocialFilterId }) {
  const { isAuthenticated } = useAuthGate();
  const { t } = useTranslation();
  const ask = useAssistantStore((s) => s.ask);
  const hiddenPostIds = useFeedPreferencesStore((s) => s.hiddenPostIds);
  const notInterestedAuthorIds = useFeedPreferencesStore((s) => s.notInterestedAuthorIds);
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

  const visiblePosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          !hiddenPostIds.includes(p.id) &&
          !notInterestedAuthorIds.includes(p.authorId) &&
          !notInterestedAuthorIds.includes(p.author.id)
      ),
    [posts, hiddenPostIds, notInterestedAuthorIds]
  );

  return (
    <div>
      <StoriesRail className="mb-3 border-0 bg-transparent p-0 shadow-none" />
      <div className="border-b border-[var(--ep-border)] pb-4">
        <PostComposer onPublished={() => load(true)} />
      </div>

      {error ? (
        <div className="py-6 text-center text-sm text-red-600" role="alert">
          <p>{t("socialFeed.error.load")}</p>
          <button
            type="button"
            className="mt-3 min-h-11 rounded-full border border-[var(--ep-border)] px-4 text-sm text-[var(--ep-fg)]"
            onClick={() => void load(true)}
          >
            {t("socialFeed.error.retry")}
          </button>
        </div>
      ) : null}

      {loading && posts.length === 0 ? (
        <div className="space-y-4 py-4">
          <SkeletonCard variant="post" />
          <SkeletonCard variant="post" />
        </div>
      ) : visiblePosts.length === 0 ? (
        <EmptyStatePremium
          icon={Users}
          title={t("socialFeed.empty.title")}
          description={t("socialFeed.empty.description")}
        />
      ) : (
        <div>
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={() => load(true)}
              onPostUpdated={(updated) =>
                setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
              }
              onPostDeleted={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))}
              onPostHidden={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))}
              onAskAi={handleAskAi}
            />
          ))}
          <div ref={sentinelRef} aria-hidden className="h-px" />
          {loadingMore ? (
            <div className="flex justify-center py-4 text-[var(--ep-fg-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
