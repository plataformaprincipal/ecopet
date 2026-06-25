"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPublicPosts } from "@/lib/public/client-api";
import type { ApiSocialPost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

type StoryItem = {
  authorId: string;
  name: string;
  avatarUrl: string | null;
  postId: string;
};

export function StoriesRail({ className }: { className?: string }) {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<ApiSocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicPosts({ limit: 24 })
      .then((d) => setPosts(d.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const stories = useMemo<StoryItem[]>(() => {
    const seen = new Set<string>();
    const items: StoryItem[] = [];
    for (const p of posts) {
      if (!p.media.some((m) => m.mediaType === "IMAGE" || m.mediaType === "VIDEO")) continue;
      if (seen.has(p.authorId)) continue;
      seen.add(p.authorId);
      items.push({ authorId: p.author.id, name: p.author.name, avatarUrl: p.author.avatarUrl, postId: p.id });
      if (items.length >= 14) break;
    }
    return items;
  }, [posts]);

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto rounded-3xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md scrollbar-none dark:border-white/10 dark:bg-zinc-900/50",
        className
      )}
      aria-label="Stories"
    >
      <button
        type="button"
        onClick={() => requireAuth()}
        className="flex shrink-0 flex-col items-center gap-1.5"
        aria-label="Adicionar story"
      >
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-ecopet-green/15 to-ecopet-yellow/15 ring-2 ring-dashed ring-ecopet-green/40">
          <Plus className="h-6 w-6 text-ecopet-green" aria-hidden />
        </span>
        <span className="max-w-[4.5rem] truncate text-[11px] text-zinc-500">{t("social.stories.yourStory")}</span>
      </button>

      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1.5" aria-hidden>
              <span className="h-16 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <span className="h-2 w-12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))
        : stories.map((s) => {
            const content = (
              <>
                <span className="rounded-full bg-gradient-to-tr from-ecopet-green via-emerald-400 to-ecopet-yellow p-[2px]">
                  <span className="block rounded-full border-2 border-white p-[1px] dark:border-zinc-900">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={s.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback>{s.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </span>
                </span>
                <span className="max-w-[4.5rem] truncate text-[11px] text-zinc-600 dark:text-zinc-300">{s.name}</span>
              </>
            );
            return isAuthenticated ? (
              <Link key={s.authorId} href={`/feed/post/${s.postId}`} className="flex shrink-0 flex-col items-center gap-1.5">
                {content}
              </Link>
            ) : (
              <button
                key={s.authorId}
                type="button"
                onClick={() => requireAuth()}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                {content}
              </button>
            );
          })}

      {!loading && stories.length === 0 ? (
        <p className="flex items-center text-sm text-zinc-400">{t("social.stories.empty")}</p>
      ) : null}
    </div>
  );
}
