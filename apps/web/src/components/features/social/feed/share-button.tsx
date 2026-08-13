"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { sharePost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { PostActionButton } from "./post-action-button";

export function ShareButton({ postId }: { postId: string }) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleShare() {
    requireAuth(async () => {
      setPending(true);
      try {
        const data = await sharePost(postId);
        const url = data.link;
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
          try {
            await navigator.share({ title: t("socialFeed.actions.shareTitle"), url });
          } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
            await navigator.clipboard.writeText(url);
          }
        } else {
          await navigator.clipboard.writeText(url);
        }
        setDone(true);
        window.setTimeout(() => setDone(false), 2000);
      } catch {
        /* ignore */
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <PostActionButton
      icon={Share2}
      label={done ? t("socialFeed.actions.shared") : t("socialFeed.actions.share")}
      onClick={() => void handleShare()}
      disabled={pending}
      active={done}
      activeClassName="text-ecopet-green"
    />
  );
}
