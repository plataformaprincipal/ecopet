"use client";

import { useState } from "react";
import {
  Bookmark,
  Copy,
  EyeOff,
  Flag,
  MoreHorizontal,
  Pencil,
  Share2,
  ThumbsDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportPostModal } from "./report-post-modal";
import {
  deletePost,
  savePost,
  sharePost,
  unsavePost,
  updatePost,
  type ApiSocialPost,
} from "@/lib/social/client-api";
import { useFeedPreferencesStore } from "@/store/feed-preferences-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";

function postAbsoluteUrl(postId: string) {
  if (typeof window === "undefined") return `/feed/post/${postId}`;
  return `${window.location.origin}/feed/post/${postId}`;
}

export function PostOverflowMenu({
  post,
  onUpdated,
  onDeleted,
  onReported,
  onHidden,
}: {
  post: ApiSocialPost;
  onUpdated?: (post: ApiSocialPost) => void;
  onDeleted?: (postId: string) => void;
  onReported?: () => void;
  onHidden?: (postId: string) => void;
}) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const { requireAuth } = useAuthGate();
  const hidePost = useFeedPreferencesStore((s) => s.hidePost);
  const markNotInterestedAuthor = useFeedPreferencesStore((s) => s.markNotInterestedAuthor);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? "");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(Boolean(post.viewerState?.saved));

  const isAuthor = Boolean(user && (user.id === post.authorId || user.id === post.author.id));

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2200);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(postAbsoluteUrl(post.id));
      showFeedback(t("socialFeed.actions.linkCopied"));
    } catch {
      setError(t("socialFeed.actions.copyFailed"));
    }
  }

  async function shareAction() {
    const url = postAbsoluteUrl(post.id);
    try {
      requireAuth(async () => {
        try {
          const data = await sharePost(post.id);
          const link = data.link || url;
          if (typeof navigator.share === "function") {
            try {
              await navigator.share({
                title: t("socialFeed.actions.shareTitle"),
                url: link,
                text: post.content?.slice(0, 120) || undefined,
              });
              return;
            } catch (err) {
              if ((err as Error)?.name === "AbortError") return;
            }
          }
          await navigator.clipboard.writeText(link);
          showFeedback(t("socialFeed.actions.linkCopied"));
        } catch {
          await navigator.clipboard.writeText(url);
          showFeedback(t("socialFeed.actions.linkCopied"));
        }
      });
    } catch {
      setError(t("socialFeed.actions.shareFailed"));
    }
  }

  async function toggleSave() {
    requireAuth(async () => {
      try {
        const data = saved ? await unsavePost(post.id) : await savePost(post.id);
        setSaved(data.saved);
        showFeedback(data.saved ? t("socialFeed.actions.savedFeedback") : t("socialFeed.actions.unsavedFeedback"));
      } catch (e) {
        setError(e instanceof Error ? e.message : t("socialFeed.actions.saveFailed"));
      }
    });
  }

  function hideFromFeed() {
    hidePost(post.id);
    onHidden?.(post.id);
    showFeedback(t("socialFeed.actions.hiddenFeedback"));
  }

  function notInterested() {
    requireAuth(() => {
      markNotInterestedAuthor(post.author.id);
      hidePost(post.id);
      onHidden?.(post.id);
      showFeedback(t("socialFeed.actions.notInterestedFeedback"));
    });
  }

  async function saveEdit() {
    setPending(true);
    setError(null);
    try {
      const data = await updatePost(post.id, editContent);
      onUpdated?.(data.post);
      setEditOpen(false);
      showFeedback(t("socialFeed.actions.editSuccess"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("socialFeed.actions.editFailed"));
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      await deletePost(post.id);
      setDeleteOpen(false);
      onDeleted?.(post.id);
      showFeedback(t("socialFeed.actions.deleteSuccess"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("socialFeed.actions.deleteFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl text-ecopet-gray hover:bg-ecopet-green/10 hover:text-ecopet-dark dark:text-white/70 dark:hover:text-white"
            aria-label={t("socialFeed.actions.more")}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          {isAuthor ? (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  setEditContent(post.content ?? "");
                  setError(null);
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                {t("socialFeed.actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                danger
                onSelect={() => {
                  setError(null);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t("socialFeed.actions.delete")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}

          <DropdownMenuItem onSelect={() => void toggleSave()}>
            <Bookmark className="h-4 w-4" aria-hidden />
            {saved ? t("socialFeed.actions.unsave") : t("socialFeed.actions.save")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void copyLink()}>
            <Copy className="h-4 w-4" aria-hidden />
            {t("socialFeed.actions.copyLink")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void shareAction()}>
            <Share2 className="h-4 w-4" aria-hidden />
            {t("socialFeed.actions.share")}
          </DropdownMenuItem>

          {!isAuthor ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={hideFromFeed}>
                <EyeOff className="h-4 w-4" aria-hidden />
                {t("socialFeed.actions.hide")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={notInterested}>
                <ThumbsDown className="h-4 w-4" aria-hidden />
                {t("socialFeed.actions.notInterested")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  requireAuth(() => {
                    setReportOpen(true);
                  })
                }
              >
                <Flag className="h-4 w-4" aria-hidden />
                {t("socialFeed.actions.report")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {feedback ? (
        <span
          role="status"
          aria-live="polite"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-40 whitespace-nowrap rounded-md bg-ecopet-dark px-2.5 py-1 text-xs text-white shadow-md dark:bg-white dark:text-ecopet-dark"
        >
          {feedback}
        </span>
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("socialFeed.actions.edit")}</DialogTitle>
            <DialogDescription>{t("socialFeed.actions.editHint")}</DialogDescription>
          </DialogHeader>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-ecopet-gray/20 bg-white p-3 text-sm text-ecopet-dark outline-none focus:ring-2 focus:ring-ecopet-green dark:border-white/15 dark:bg-ecopet-dark-bg dark:text-white"
            aria-label={t("socialFeed.actions.edit")}
          />
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={() => void saveEdit()} disabled={pending || !editContent.trim()}>
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("socialFeed.actions.delete")}</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir esta publicação? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={pending}>
              Excluir publicação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReportPostModal
        postId={post.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onReported={onReported}
      />
    </div>
  );
}
