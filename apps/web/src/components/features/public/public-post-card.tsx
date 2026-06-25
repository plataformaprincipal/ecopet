"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Share2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ApiSocialPost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { HashtagLink } from "@/components/features/social/feed/hashtag-link";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

type PublicPostCardProps = {
  post: ApiSocialPost;
};

export function PublicPostCard({ post }: PublicPostCardProps) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const mainImage = post.media.find((m) => m.mediaType === "IMAGE")?.fileUrl;

  return (
    <article className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-lg dark:border-white/10 dark:bg-zinc-900/60">
      <header className="flex items-center gap-3 p-4">
        <Link href={`/feed/profile/${post.author.id}`}>
          <Avatar className="h-11 w-11 ring-2 ring-ecopet-green/20">
            <AvatarImage src={post.author.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/feed/profile/${post.author.id}`} className="font-semibold text-zinc-900 hover:underline dark:text-white">
            {post.author.name}
          </Link>
          {post.pet ? (
            <p className="truncate text-xs text-ecopet-green">🐾 {post.pet.name}</p>
          ) : null}
          <time className="text-xs text-zinc-500" dateTime={post.createdAt}>
            {timeAgo(post.createdAt)}
          </time>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 rounded-xl"
          onClick={() => requireAuth()}
        >
          <UserPlus className="mr-1 h-3.5 w-3.5" aria-hidden />
          {t("pub.card.follow")}
        </Button>
      </header>

      {mainImage ? (
        <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-800">
          <Image src={mainImage} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 640px" />
        </div>
      ) : null}

      {post.content ? (
        <p className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {post.content}
        </p>
      ) : null}

      {post.hashtags.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {post.hashtags.map((h) => (
            <HashtagLink key={h.id} slug={h.slug} name={h.name} />
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 dark:border-white/5">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => requireAuth()} aria-label={t("pub.card.like")}>
            <Heart className="mr-1 h-4 w-4" aria-hidden />
            {post.counts.likes}
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => requireAuth()} aria-label={t("pub.card.comment")}>
            <MessageCircle className="mr-1 h-4 w-4" aria-hidden />
            {post.counts.comments}
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => requireAuth()} aria-label={t("pub.card.share")}>
            <Share2 className="mr-1 h-4 w-4" aria-hidden />
            {post.counts.shares}
          </Button>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link href={`/feed/post/${post.id}`}>{t("pub.card.viewPost")}</Link>
        </Button>
      </div>
    </article>
  );
}
