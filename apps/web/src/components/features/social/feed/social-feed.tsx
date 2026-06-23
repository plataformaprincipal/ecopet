"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";
import { PostTypeFilters, type PostTypeFilter } from "./post-type-filters";
import { fetchFeed, type ApiSocialPost } from "@/lib/social/client-api";
import { useTranslation } from "@/providers/i18n-provider";
import { useAuthGate } from "@/providers/auth-gate-provider";

export function SocialFeed({ hashtag, authorId }: { hashtag?: string; authorId?: string }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthGate();
  const [posts, setPosts] = useState<ApiSocialPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PostTypeFilter>("ALL");

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFeed({
        cursor: reset ? undefined : cursor ?? undefined,
        hashtag,
        authorId,
        type: typeFilter === "ALL" ? undefined : typeFilter,
      });
      setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
      setCursor(data.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("socialFeed.error.load"));
    } finally {
      setLoading(false);
    }
  }, [cursor, hashtag, authorId, typeFilter, t]);

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashtag, authorId, typeFilter]);

  return (
    <div className="space-y-4">
      {!authorId && <PostComposer onPublished={() => load(true)} />}

      {!hashtag && (
        <PostTypeFilters value={typeFilter} onChange={setTypeFilter} />
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={() => load(true)}>
            {t("socialFeed.error.retry")}
          </Button>
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="space-y-3" aria-busy="true" aria-label={t("common.loading")}>
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("socialFeed.empty.title")}
          description={
            isAuthenticated
              ? t("socialFeed.empty.description")
              : t("socialFeed.authModal.description")
          }
        />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} onUpdate={() => load(true)} />)
      )}

      {cursor && !loading && (
        <Button variant="outline" className="w-full" onClick={() => load(false)}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden /> {t("socialFeed.loadMore")}
        </Button>
      )}
    </div>
  );
}
