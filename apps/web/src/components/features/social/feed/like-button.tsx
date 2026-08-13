"use client";

import { useRef, useState } from "react";
import { Heart } from "lucide-react";
import { likePost, unlikePost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { analyticsService } from "@/lib/analytics/service";
import { SocialEvents } from "@/lib/analytics/events";
import { PostActionButton } from "./post-action-button";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked?: boolean;
  initialCount: number;
}) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  async function toggle() {
    requireAuth(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      setPending(true);
      const wasLiked = liked;
      const prevCount = count;
      setLiked(!wasLiked);
      setCount(wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
      try {
        const data = wasLiked ? await unlikePost(postId) : await likePost(postId);
        setLiked(data.liked);
        setCount(data.count);
        if (!wasLiked && data.liked) {
          analyticsService.track(SocialEvents.LIKE, {
            params: { content_type: "post", item_id: postId },
          });
        }
      } catch {
        setLiked(wasLiked);
        setCount(prevCount);
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    });
  }

  return (
    <PostActionButton
      icon={Heart}
      label={liked ? t("socialFeed.actions.unlike") : t("socialFeed.actions.like")}
      count={count}
      active={liked}
      activeClassName="text-red-500"
      onClick={() => void toggle()}
      disabled={pending}
    />
  );
}
