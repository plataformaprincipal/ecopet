"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";
import { fetchFeed, type ApiSocialPost } from "@/lib/social/client-api";

export function SocialFeed({ hashtag, authorId }: { hashtag?: string; authorId?: string }) {
  const [posts, setPosts] = useState<ApiSocialPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFeed({ cursor: reset ? undefined : cursor ?? undefined, hashtag, authorId });
      setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
      setCursor(data.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar feed");
    } finally {
      setLoading(false);
    }
  }, [cursor, hashtag, authorId]);

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashtag, authorId]);

  return (
    <div className="space-y-4">
      {!authorId && <PostComposer onPublished={() => load(true)} />}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={() => load(true)}>
            Tentar novamente
          </Button>
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={FileText} title="Feed vazio" description="Nenhuma publicação ainda. Seja o primeiro a compartilhar!" />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} onUpdate={() => load(true)} />)
      )}

      {cursor && !loading && (
        <Button variant="outline" className="w-full" onClick={() => load(false)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Carregar mais
        </Button>
      )}
    </div>
  );
}
