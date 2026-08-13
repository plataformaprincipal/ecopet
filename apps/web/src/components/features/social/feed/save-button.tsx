"use client";

import { useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import { savePost, unsavePost } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { PostActionButton } from "./post-action-button";

export function SaveButton({
  postId,
  initialSaved,
  onChanged,
}: {
  postId: string;
  initialSaved?: boolean;
  onChanged?: (saved: boolean) => void;
}) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  async function toggle() {
    requireAuth(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      setPending(true);
      const wasSaved = saved;
      setSaved(!wasSaved);
      onChanged?.(!wasSaved);
      try {
        const data = wasSaved ? await unsavePost(postId) : await savePost(postId);
        setSaved(data.saved);
        onChanged?.(data.saved);
      } catch {
        setSaved(wasSaved);
        onChanged?.(wasSaved);
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    });
  }

  return (
    <PostActionButton
      icon={Bookmark}
      label={saved ? t("socialFeed.actions.unsave") : t("socialFeed.actions.save")}
      active={saved}
      activeClassName="text-ecopet-green"
      onClick={() => void toggle()}
      disabled={pending}
    />
  );
}
