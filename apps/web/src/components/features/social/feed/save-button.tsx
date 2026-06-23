"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePost, unsavePost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";

export function SaveButton({ postId, initialSaved }: { postId: string; initialSaved?: boolean }) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(initialSaved ?? false);

  async function toggle() {
    requireAuth(async () => {
      try {
        const data = saved ? await unsavePost(postId) : await savePost(postId);
        setSaved(data.saved);
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
      className={saved ? "text-ecopet-primary" : ""}
      aria-label={saved ? t("socialFeed.actions.unsave") : t("socialFeed.actions.save")}
      aria-pressed={saved}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden />
    </Button>
  );
}
