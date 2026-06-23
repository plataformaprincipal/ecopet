"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sharePost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";

export function ShareButton({ postId }: { postId: string }) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [done, setDone] = useState(false);

  async function handleShare() {
    requireAuth(async () => {
      try {
        const data = await sharePost(postId);
        await navigator.clipboard.writeText(data.link);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      } catch {
        /* ignore */
      }
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleShare} aria-label={t("socialFeed.actions.share")}>
      <Share2 className="mr-1 h-4 w-4" aria-hidden />
      {done ? t("socialFeed.actions.shared") : t("socialFeed.actions.share")}
    </Button>
  );
}
