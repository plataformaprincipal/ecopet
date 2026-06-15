"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReplyComposer } from "./reply-composer";
import type { ApiSocialComment } from "@/lib/social/client-api";

export function CommentItem({
  comment,
  postId,
  onReply,
}: {
  comment: ApiSocialComment;
  postId: string;
  onReply: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const removed = comment.status === "REMOVED" || comment.deletedAt;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatarUrl ?? undefined} />
          <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium">{comment.author.name}</p>
          {removed ? (
            <p className="text-sm italic text-muted-foreground">Comentário removido</p>
          ) : (
            <>
              <p className="text-sm">{comment.content}</p>
              {comment.editedAt && <span className="text-xs text-muted-foreground">editado</span>}
              <button type="button" className="mt-1 text-xs text-ecopet-primary" onClick={() => setShowReply((v) => !v)}>
                Responder
              </button>
            </>
          )}
        </div>
      </div>
      {showReply && <ReplyComposer postId={postId} parentCommentId={comment.id} onCreated={() => { setShowReply(false); onReply(); }} />}
      {comment.replies?.map((r) => (
        <div key={r.id} className="ml-10">
          <CommentItem comment={r} postId={postId} onReply={onReply} />
        </div>
      ))}
    </div>
  );
}
