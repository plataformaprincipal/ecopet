"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePost, fetchTrash, restorePost, type ApiSocialPost } from "@/lib/social/client-api";
import { useTranslation } from "@/providers/i18n-provider";

export function SocialTrashPanel() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<ApiSocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hardId, setHardId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrash();
      setPosts(data.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("socialFeed.trash.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(id: string) {
    setPending(true);
    try {
      await restorePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("socialFeed.trash.restoreFailed"));
    } finally {
      setPending(false);
    }
  }

  async function confirmHard() {
    if (!hardId) return;
    setPending(true);
    try {
      await deletePost(hardId, true);
      setPosts((prev) => prev.filter((p) => p.id !== hardId));
      setHardId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("socialFeed.trash.hardFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--ep-fg)]">{t("socialFeed.trash.title")}</h1>
        <p className="text-sm text-[var(--ep-fg-muted)]">{t("socialFeed.trash.hint")}</p>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <div className="space-y-2" aria-busy="true">
          <div className="h-20 animate-pulse rounded-xl bg-[var(--ep-bg-muted)]" />
          <div className="h-20 animate-pulse rounded-xl bg-[var(--ep-bg-muted)]" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-[var(--ep-fg-muted)]">{t("socialFeed.trash.empty")}</p>
      ) : (
        <ul className="divide-y divide-[var(--ep-border)]">
          {posts.map((post) => (
            <li key={post.id} data-testid={`trash-post-${post.id}`} className="flex items-start justify-between gap-3 py-4">
              <p className="min-w-0 flex-1 text-sm text-[var(--ep-fg)]">
                {post.content?.slice(0, 180) || t("socialFeed.trash.noText")}
              </p>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => void restore(post.id)}>
                  {t("socialFeed.trash.restore")}
                </Button>
                <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={() => setHardId(post.id)}>
                  {t("socialFeed.actions.hardDelete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(hardId)} onOpenChange={(v) => !v && setHardId(null)}>
        <DialogContent data-testid="hard-delete-dialog">
          <DialogHeader>
            <DialogTitle>{t("socialFeed.actions.hardDeleteTitle")}</DialogTitle>
            <DialogDescription>{t("socialFeed.actions.hardDeleteBody")}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setHardId(null)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmHard()} disabled={pending}>
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              {t("socialFeed.actions.hardDeleteConfirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
