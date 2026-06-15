"use client";

import { useCallback, useEffect, useState } from "react";
import { CommentItem } from "./comment-item";
import { CommentComposer } from "./comment-composer";
import { fetchComments, type ApiSocialComment } from "@/lib/social/client-api";
import { Skeleton } from "@/components/ui/skeleton";

export function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<ApiSocialComment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchComments(postId);
      setComments(data.comments);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="border-t border-ecopet-gray/10 px-4 py-3">
      <CommentComposer postId={postId} onCreated={load} />
      {loading ? (
        <Skeleton className="mt-3 h-12 w-full" />
      ) : comments.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nenhum comentário ainda.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} postId={postId} onReply={load} />
          ))}
        </div>
      )}
    </div>
  );
}
