"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { likePost, unlikePost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";

export function LikeButton({ postId, initialLiked, initialCount }: { postId: string; initialLiked?: boolean; initialCount: number }) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [count, setCount] = useState(initialCount);

  async function toggle() {
    requireAuth(async () => {
      try {
        const data = liked ? await unlikePost(postId) : await likePost(postId);
        setLiked(data.liked);
        setCount(data.count);
      } catch {
        /* ignore */
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={liked ? "text-red-500" : ""}
      aria-label={liked ? t("socialFeed.actions.unlike") : t("socialFeed.actions.like")}
      aria-pressed={liked}
    >
      <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-current" : ""}`} aria-hidden />
      {count}
    </Button>
  );
}
