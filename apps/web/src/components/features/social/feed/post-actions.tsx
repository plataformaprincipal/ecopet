"use client";

import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LikeButton } from "./like-button";
import { SaveButton } from "./save-button";
import { ShareButton } from "./share-button";
import { ReportPostModal } from "./report-post-modal";
import type { ApiSocialPost } from "@/lib/social/client-api";

export function PostActions({
  post,
  onToggleComments,
  onUpdate,
}: {
  post: ApiSocialPost;
  onToggleComments: () => void;
  onUpdate?: () => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="border-t border-ecopet-gray/10 px-4 py-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{post.counts.likes} curtidas</span>
        <span className="mx-1">·</span>
        <span>{post.counts.comments} comentários</span>
        <span className="mx-1">·</span>
        <span>{post.counts.shares} compartilhamentos</span>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <LikeButton postId={post.id} initialLiked={post.viewerState?.liked} initialCount={post.counts.likes} />
        <Button variant="ghost" size="sm" onClick={onToggleComments}>
          <MessageCircle className="mr-1 h-4 w-4" /> Comentar
        </Button>
        <SaveButton postId={post.id} initialSaved={post.viewerState?.saved} />
        <ShareButton postId={post.id} />
        <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setReportOpen(true)}>
          Denunciar
        </Button>
      </div>
      <ReportPostModal postId={post.id} open={reportOpen} onClose={() => setReportOpen(false)} onReported={onUpdate} />
    </div>
  );
}
