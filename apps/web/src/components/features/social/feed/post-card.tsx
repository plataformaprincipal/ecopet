"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostMediaGrid } from "./post-media-grid";
import { PostActions } from "./post-actions";
import { CommentList } from "./comment-list";
import { HashtagLink } from "./hashtag-link";
import type { ApiSocialPost } from "@/lib/social/client-api";

export function PostCard({ post, onUpdate }: { post: ApiSocialPost; onUpdate?: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const removed = post.status === "REMOVED" || post.deletedAt;
  const hidden = post.status === "HIDDEN";

  return (
    <article className="rounded-xl border border-ecopet-gray/15 bg-white shadow-sm">
      <header className="flex items-center gap-3 p-4">
        <Link href={`/feed/profile/${post.author.id}`}>
          <Avatar>
            <AvatarImage src={post.author.avatarUrl ?? undefined} />
            <AvatarFallback>{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link href={`/feed/profile/${post.author.id}`} className="font-semibold hover:underline">
            {post.author.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleString("pt-BR")}
            {post.editedAt && " · editado"}
          </p>
        </div>
      </header>

      {removed ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground italic">Publicação removida</p>
      ) : (
        <>
          {hidden && <p className="px-4 text-xs text-amber-600">Publicação oculta pela moderação</p>}
          {post.content && <p className="whitespace-pre-wrap px-4 pb-2 text-sm">{post.content}</p>}
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {post.hashtags.map((h) => (
                <HashtagLink key={h.id} slug={h.slug} name={h.name} />
              ))}
            </div>
          )}
          <PostMediaGrid media={post.media} />
          <PostActions post={post} onToggleComments={() => setShowComments((v) => !v)} onUpdate={onUpdate} />
          {showComments && <CommentList postId={post.id} />}
        </>
      )}
    </article>
  );
}
