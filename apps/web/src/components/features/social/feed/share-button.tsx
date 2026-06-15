"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sharePost } from "@/lib/social/client-api";

export function ShareButton({ postId }: { postId: string }) {
  const [done, setDone] = useState(false);

  async function handleShare() {
    try {
      const data = await sharePost(postId);
      await navigator.clipboard.writeText(data.link);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleShare}>
      <Share2 className="mr-1 h-4 w-4" />
      {done ? "Link copiado!" : "Compartilhar"}
    </Button>
  );
}
