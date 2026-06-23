"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";

export function CommentComposer({ postId, onCreated }: { postId: string; onCreated?: () => void }) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    requireAuth(async () => {
      if (!content.trim()) return;
      setPending(true);
      try {
        await createComment(postId, content);
        setContent("");
        onCreated?.();
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("socialFeed.comments.placeholder")}
        rows={2}
        className="flex-1"
        aria-label={t("socialFeed.comments.placeholder")}
        onFocus={() => requireAuth()}
      />
      <Button size="sm" onClick={submit} disabled={pending} aria-label={t("socialFeed.comments.send")}>
        {t("socialFeed.comments.send")}
      </Button>
    </div>
  );
}
