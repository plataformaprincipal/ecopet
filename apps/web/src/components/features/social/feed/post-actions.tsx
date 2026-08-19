"use client";

import { MessageCircle } from "lucide-react";
import { LikeButton } from "./like-button";
import { SaveButton } from "./save-button";
import { ShareButton } from "./share-button";
import { PostActionButton } from "./post-action-button";
import type { ApiSocialPost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";

export function PostActions({
  post,
  onToggleComments,
}: {
  post: ApiSocialPost;
  onToggleComments: () => void;
  onUpdate?: () => void;
}) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();

  return (
    <div className="px-1 py-1">
      {post.likesVisible !== false || post.counts.comments || post.counts.shares ? (
        <div
          className="flex items-center gap-1 px-1 pt-1 text-xs text-[var(--ep-fg-muted)]"
          aria-live="polite"
        >
          {post.likesVisible !== false ? (
            <span>{t("socialFeed.stats.likes", { count: String(post.counts.likes) })}</span>
          ) : null}
          {post.likesVisible !== false ? (
            <span className="mx-1" aria-hidden>
              ·
            </span>
          ) : null}
          <span>{t("socialFeed.stats.comments", { count: String(post.counts.comments) })}</span>
          <span className="mx-1" aria-hidden>
            ·
          </span>
          <span>{t("socialFeed.stats.shares", { count: String(post.counts.shares) })}</span>
        </div>
      ) : null}
      <div className="mt-0.5 flex items-center justify-between gap-0.5">
        <div className="flex min-w-0 flex-1 items-center">
          <LikeButton
            postId={post.id}
            initialLiked={post.viewerState?.liked}
            initialCount={post.counts.likes}
            likesVisible={post.likesVisible !== false}
          />
          <PostActionButton
            icon={MessageCircle}
            label={t("socialFeed.actions.comment")}
            count={post.counts.comments}
            onClick={() => requireAuth(onToggleComments)}
          />
          <ShareButton postId={post.id} />
        </div>
        <SaveButton postId={post.id} initialSaved={post.viewerState?.saved} />
      </div>
    </div>
  );
}
