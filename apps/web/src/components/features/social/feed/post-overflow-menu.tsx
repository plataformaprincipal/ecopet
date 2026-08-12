"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Copy, Flag, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReportPostModal } from "./report-post-modal";
import {
  deletePost,
  updatePost,
  type ApiSocialPost,
} from "@/lib/social/client-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

function postAbsoluteUrl(postId: string) {
  if (typeof window === "undefined") return `/feed/post/${postId}`;
  return `${window.location.origin}/feed/post/${postId}`;
}

export function PostOverflowMenu({
  post,
  onUpdated,
  onDeleted,
  onReported,
}: {
  post: ApiSocialPost;
  onUpdated?: (post: ApiSocialPost) => void;
  onDeleted?: (postId: string) => void;
  onReported?: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const { requireAuth } = useAuthGate();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? "");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = Boolean(user && (user.id === post.authorId || user.id === post.author.id));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2000);
  }

  async function copyLink() {
    const url = postAbsoluteUrl(post.id);
    try {
      await navigator.clipboard.writeText(url);
      showFeedback(t("socialFeed.actions.linkCopied"));
    } catch {
      setError(t("socialFeed.actions.copyFailed"));
    }
    setOpen(false);
  }

  async function sharePostAction() {
    const url = postAbsoluteUrl(post.id);
    const title = t("socialFeed.actions.shareTitle");
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, url, text: post.content?.slice(0, 120) || title });
      } else {
        await navigator.clipboard.writeText(url);
        showFeedback(t("socialFeed.actions.linkCopied"));
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        showFeedback(t("socialFeed.actions.linkCopied"));
      } catch {
        setError(t("socialFeed.actions.shareFailed"));
      }
    }
    setOpen(false);
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
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label={t("socialFeed.actions.more")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-ecopet-gray/15 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-ecopet-dark-card"
        >
          {isAuthor ? (
            <>
              <MenuItem
                icon={Pencil}
                label={t("socialFeed.actions.edit")}
                onClick={() => {
                  setEditContent(post.content ?? "");
                  setError(null);
                  setOpen(false);
                  setEditOpen(true);
                }}
              />
              <MenuItem
                icon={Trash2}
                label={t("socialFeed.actions.delete")}
                danger
                onClick={() => {
                  setError(null);
                  setOpen(false);
                  setDeleteOpen(true);
                }}
              />
            </>
          ) : null}
          <MenuItem icon={Copy} label={t("socialFeed.actions.copyLink")} onClick={() => void copyLink()} />
          <MenuItem icon={Share2} label={t("socialFeed.actions.share")} onClick={() => void sharePostAction()} />
          {!isAuthor ? (
            <MenuItem
              icon={Flag}
              label={t("socialFeed.actions.report")}
              onClick={() => requireAuth(() => {
                setOpen(false);
                setReportOpen(true);
              })}
            />
          ) : null}
        </div>
      )}

      {feedback ? (
        <span
          role="status"
          aria-live="polite"
          className="absolute right-0 top-[calc(100%+0.25rem)] z-40 whitespace-nowrap rounded-md bg-ecopet-dark px-2 py-1 text-xs text-white shadow-md"
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
            className="w-full rounded-xl border border-ecopet-gray/20 bg-transparent p-3 text-sm text-ecopet-dark outline-none focus:ring-2 focus:ring-ecopet-green dark:border-white/15 dark:text-white"
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
              Excluir
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

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-ecopet-green/10",
        danger ? "text-red-600" : "text-ecopet-dark dark:text-white"
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
