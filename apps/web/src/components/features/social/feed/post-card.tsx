"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostMediaGrid } from "./post-media-grid";
import { PostActions } from "./post-actions";
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
  onAskAi,
}: {
  post: ApiSocialPost;
  onUpdate?: () => void;
  onAskAi?: (post: ApiSocialPost) => void;
}) {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const removed = post.status === "REMOVED" || post.deletedAt;
  const hidden = post.status === "HIDDEN";

  return (
    <article className="rounded-xl border border-ecopet-gray/15 bg-white shadow-sm">
      <header className="flex items-center gap-3 p-4">
        <Link href={`/feed/profile/${post.author.id}`} aria-label={post.author.name}>
          <Avatar>
            <AvatarImage src={post.author.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/feed/profile/${post.author.id}`} className="font-semibold hover:underline">
              {post.author.name}
            </Link>
            <PersonaBadge role={post.author.role} />
            {post.type && <PostTypeBadge type={post.type} />}
          </div>
          <p className="text-xs text-muted-foreground">
            <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleString()}</time>
            {post.editedAt && ` · ${t("socialFeed.post.edited")}`}
          </p>
        </div>
      </header>

      {removed ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground italic">{t("socialFeed.post.removed")}</p>
      ) : (
        <>
          {hidden && <p className="px-4 text-xs text-amber-600">{t("socialFeed.post.hidden")}</p>}
          {post.content && <p className="whitespace-pre-wrap px-4 pb-2 text-sm">{post.content}</p>}
          <AdoptionMetaCard post={post} />
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {post.hashtags.map((h) => (
                <HashtagLink key={h.id} slug={h.slug} name={h.name} />
              ))}
            </div>
          )}
          <PostMediaGrid media={post.media} />
          {onAskAi ? (
            <div className="px-4 pb-1">
              <button
                type="button"
                onClick={() => onAskAi(post)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ecopet-green/30 bg-ecopet-green/5 px-3 py-1 text-xs font-medium text-ecopet-green transition hover:bg-ecopet-green/10"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Perguntar à EccoPet
              </button>
            </div>
          ) : null}
          <PostCtaBar post={post} />
          <PostActions post={post} onToggleComments={() => setShowComments((v) => !v)} onUpdate={onUpdate} />
          {showComments && <CommentList postId={post.id} />}
        </>
      )}
    </article>
  );
}
