"use client";

import Link from "next/link";
import { useState } from "react";
import { Pin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostMediaGrid } from "./post-media-grid";
import { PostActions } from "./post-actions";
import { PostOverflowMenu } from "./post-overflow-menu";
import { CommentList } from "./comment-list";
import { HashtagLink } from "./hashtag-link";
import { PersonaBadge, PostTypeBadge } from "./persona-badge";
import { AdoptionMetaCard } from "./adoption-meta-card";
import { PostCtaBar } from "./post-cta-bar";
import type { ApiSocialPost } from "@/lib/social/client-api";
import { useTranslation } from "@/providers/i18n-provider";

export function PostCard({
  post,
  onUpdate,
  onPostUpdated,
  onPostDeleted,
  onPostHidden,
  onAskAi,
}: {
  post: ApiSocialPost;
  onUpdate?: () => void;
  onPostUpdated?: (post: ApiSocialPost) => void;
  onPostDeleted?: (postId: string) => void;
  onPostHidden?: (postId: string) => void;
  onAskAi?: (post: ApiSocialPost) => void;
}) {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const removed = post.status === "REMOVED" || Boolean(post.deletedAt);
  const hidden = post.status === "HIDDEN";
  const commentsEnabled = post.commentsEnabled !== false;

  return (
    <article className="border-b border-[var(--ep-border)] bg-transparent px-0 py-4 sm:py-5">
      <header className="flex items-start gap-3">
        <Link href={`/feed/profile/${post.author.id}`} aria-label={post.author.name} className="shrink-0">
          <Avatar>
            <AvatarImage src={post.author.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/feed/profile/${post.author.id}`}
              className="font-semibold text-[var(--ep-fg)] hover:underline"
            >
              {post.author.name}
            </Link>
            <PersonaBadge role={post.author.role} />
            {post.type && <PostTypeBadge type={post.type} />}
            {post.isPinned ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ep-fg-muted)]">
                <Pin className="h-3 w-3" aria-hidden />
                {t("socialFeed.post.pinned")}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-[var(--ep-fg-muted)]">
            <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleString()}</time>
            {post.editedAt ? ` · ${t("socialFeed.post.edited")}` : ""}
          </p>
        </div>
        {!removed ? (
          <PostOverflowMenu
            post={post}
            onUpdated={onPostUpdated}
            onDeleted={onPostDeleted}
            onHidden={onPostHidden}
            onReported={onUpdate}
          />
        ) : null}
      </header>

      {removed ? (
        <p className="mt-3 text-sm italic text-[var(--ep-fg-muted)]">{t("socialFeed.post.removed")}</p>
      ) : (
        <>
          {hidden && <p className="mt-2 text-xs text-ep-warning">{t("socialFeed.post.hidden")}</p>}
          {post.content ? (
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ep-fg)]">{post.content}</p>
          ) : null}
          <AdoptionMetaCard post={post} />
          {post.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {post.hashtags.map((h) => (
                <HashtagLink key={h.id} slug={h.slug} name={h.name} />
              ))}
            </div>
          )}
          <div className="mt-3 overflow-hidden rounded-2xl">
            <PostMediaGrid media={post.media} />
          </div>
          <PostCtaBar post={post} />
          {onAskAi ? (
            <button
              type="button"
              onClick={() => onAskAi(post)}
              className="mt-1 text-xs text-[var(--ep-fg-muted)] underline-offset-2 hover:underline"
            >
              {t("social.feed.askAiLabel")}
            </button>
          ) : null}
          <PostActions post={post} onToggleComments={() => setShowComments((v) => !v)} onUpdate={onUpdate} />
          {showComments ? (
            commentsEnabled ? (
              <CommentList postId={post.id} />
            ) : (
              <div className="mt-2">
                <p className="text-sm text-[var(--ep-fg-muted)]">{t("socialFeed.comments.disabledByAuthor")}</p>
                <CommentList postId={post.id} readOnly />
              </div>
            )
          ) : null}
        </>
      )}
    </article>
  );
}
