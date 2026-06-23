"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LikeButton } from "./like-button";
import { SaveButton } from "./save-button";
import { ShareButton } from "./share-button";
import { ReportPostModal } from "./report-post-modal";
import type { ApiSocialPost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";

export function PostActions({
  post,
  onToggleComments,
  onUpdate,
}: {
  post: ApiSocialPost;
  onToggleComments: () => void;
  onUpdate?: () => void;
}) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="border-t border-ecopet-gray/10 px-4 py-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground" aria-live="polite">
        <span>{t("socialFeed.stats.likes", { count: String(post.counts.likes) })}</span>
        <span className="mx-1" aria-hidden>·</span>
        <span>{t("socialFeed.stats.comments", { count: String(post.counts.comments) })}</span>
        <span className="mx-1" aria-hidden>·</span>
        <span>{t("socialFeed.stats.shares", { count: String(post.counts.shares) })}</span>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <LikeButton postId={post.id} initialLiked={post.viewerState?.liked} initialCount={post.counts.likes} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => requireAuth(onToggleComments)}
          aria-label={t("socialFeed.actions.comment")}
        >
          <MessageCircle className="mr-1 h-4 w-4" aria-hidden /> {t("socialFeed.actions.comment")}
        </Button>
        <SaveButton postId={post.id} initialSaved={post.viewerState?.saved} />
        <ShareButton postId={post.id} />
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-xs"
          onClick={() => requireAuth(() => setReportOpen(true))}
          aria-label={t("socialFeed.actions.report")}
        >
          {t("socialFeed.actions.report")}
        </Button>
      </div>
      <ReportPostModal postId={post.id} open={reportOpen} onClose={() => setReportOpen(false)} onReported={onUpdate} />
    </div>
  );
}
