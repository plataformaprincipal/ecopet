"use client";

import { useState } from "react";
import { Send } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    requireAuth(async () => {
      if (!content.trim() || pending) return;
      setPending(true);
      setError(null);
      try {
        await createComment(postId, content);
        setContent("");
        setSent(true);
        window.setTimeout(() => setSent(false), 1500);
        onCreated?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("socialFeed.comments.sendError"));
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 rounded-2xl border border-ecopet-gray/15 bg-ecopet-cream/40 p-2 dark:border-white/10 dark:bg-white/5">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("socialFeed.comments.placeholder")}
          rows={2}
          className="min-h-[44px] flex-1 resize-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0 dark:text-white"
          aria-label={t("socialFeed.comments.placeholder")}
          onFocus={() => requireAuth()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl"
          onClick={() => void submit()}
          disabled={pending || !content.trim()}
          aria-label={t("socialFeed.comments.send")}
          title={t("socialFeed.comments.send")}
        >
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {sent ? (
        <p className="text-xs text-ecopet-green" role="status" aria-live="polite">
          {t("socialFeed.comments.sent")}
        </p>
      ) : null}
    </div>
  );
}
