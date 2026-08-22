"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { StoryComposer } from "@/components/features/social/story-composer";

type StoryItem = {
  authorId: string;
  name: string;
  avatarUrl: string | null;
  postId: string;
};

export function StoriesRail({ className }: { className?: string }) {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [composerOpen, setComposerOpen] = useState(false);
  const [storiesFromApi, setStoriesFromApi] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/social/stories", { credentials: "include" })
      .then((r) => r.json())
      .then((storyJson) => {
        if (cancelled) return;
        if (storyJson?.success && Array.isArray(storyJson.data?.stories)) {
          setStoriesFromApi(
            storyJson.data.stories.map((s: { id: string; authorId: string; author: { name: string; avatarUrl: string | null } }) => ({
              authorId: s.authorId,
              name: s.author.name,
              avatarUrl: s.author.avatarUrl,
              postId: s.id,
            }))
          );
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stories = useMemo<StoryItem[]>(() => {
    const seen = new Set<string>();
    const items: StoryItem[] = [];
    for (const s of storiesFromApi) {
      if (seen.has(s.authorId)) continue;
      seen.add(s.authorId);
      items.push(s);
    }
    return items;
  }, [storiesFromApi]);

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto rounded-3xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4 shadow-sm backdrop-blur-md scrollbar-none",
        className
      )}
      aria-label="Stories"
    >
      <button
        type="button"
        onClick={() => requireAuth(() => setComposerOpen(true))}
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
              <Link key={s.authorId} href={`/social/stories/${s.postId}`} className="flex shrink-0 flex-col items-center gap-1.5">
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
      <StoryComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={() => {
          void fetch("/api/social/stories", { credentials: "include" })
            .then((r) => r.json())
            .then((json) => {
              if (json?.success && Array.isArray(json.data?.stories)) {
                setStoriesFromApi(
                  json.data.stories.map((s: { id: string; authorId: string; author: { name: string; avatarUrl: string | null } }) => ({
                    authorId: s.authorId,
                    name: s.author.name,
                    avatarUrl: s.author.avatarUrl,
                    postId: s.id,
                  }))
                );
              }
            });
        }}
      />
    </div>
  );
}
