"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { likePost, unlikePost } from "@/lib/social/client-api";

export function LikeButton({ postId, initialLiked, initialCount }: { postId: string; initialLiked?: boolean; initialCount: number }) {
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [count, setCount] = useState(initialCount);

  async function toggle() {
    try {
      const data = liked ? await unlikePost(postId) : await likePost(postId);
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className={liked ? "text-red-500" : ""}>
      <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-current" : ""}`} />
      {count}
    </Button>
  );
}
