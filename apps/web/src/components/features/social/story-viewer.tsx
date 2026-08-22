"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type StoryPayload = {
  id: string;
  author: { name: string; avatarUrl: string | null };
  content: string | null;
  mediaUrls: string[];
  createdAt: string;
};

export function StoryViewer({ storyId }: { storyId: string }) {
  const router = useRouter();
  const [story, setStory] = useState<StoryPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/social/stories/${storyId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.success) {
          setError(json.error?.message ?? "Story indisponível.");
          return;
        }
        setStory(json.data.story);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível abrir o story.");
      });
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  const media = story?.mediaUrls[0];
  const isVideo = Boolean(media && /\.(mp4|webm)(\?|$)/i.test(media));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--ep-bg)]/95 p-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-[var(--ep-fg)]"
        aria-label="Fechar"
        onClick={() => router.back()}
      >
        <X className="h-5 w-5" />
      </Button>
      {error ? (
        <p className="max-w-sm text-center text-sm text-[var(--ep-fg-muted)]">{error}</p>
      ) : !story ? (
        <p className="text-sm text-[var(--ep-fg-muted)]">Carregando…</p>
      ) : (
        <div className="flex w-full max-w-md flex-col gap-3">
          <p className="text-sm font-semibold text-[var(--ep-fg)]">{story.author.name}</p>
          <div className="overflow-hidden rounded-2xl bg-[var(--ep-bg-elevated)]">
            {media && isVideo ? (
              <video src={media} controls autoPlay className="max-h-[80vh] w-full object-contain" />
            ) : media ? (
              <Image src={media} alt="" width={720} height={1280} className="max-h-[80vh] w-full object-contain" unoptimized />
            ) : null}
          </div>
          {story.content ? <p className="text-sm text-[var(--ep-fg)]">{story.content}</p> : null}
        </div>
      )}
    </div>
  );
}
