"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { CommentItem } from "./comment-item";
import { CommentComposer } from "./comment-composer";
import { fetchComments, type ApiSocialComment } from "@/lib/social/client-api";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/providers/i18n-provider";

export function CommentList({ postId, readOnly }: { postId: string; readOnly?: boolean }) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<ApiSocialComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComments(postId);
      setComments(data.comments);
    } catch {
      setError(t("socialFeed.comments.loadError"));
    } finally {
      setLoading(false);
    }
  }, [postId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="border-t border-[var(--ep-border)] bg-transparent px-0 py-4">
      {readOnly ? null : <CommentComposer postId={postId} onCreated={() => void load()} />}
      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-3/4 rounded-xl" />
        </div>
      ) : error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : comments.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
          <MessageCircle className="h-6 w-6 text-ecopet-gray/50" aria-hidden />
          <p className="text-sm text-ecopet-gray dark:text-white/55">{t("socialFeed.comments.empty")}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} postId={postId} onReply={() => void load()} />
          ))}
        </div>
      )}
    </div>
  );
}
