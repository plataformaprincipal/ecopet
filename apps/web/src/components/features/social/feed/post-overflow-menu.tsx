"use client";

import { useState } from "react";
import {
  Archive,
  Bookmark,
  Copy,
  EyeOff,
  Flag,
  Globe,
  HeartOff,
  Lock,
  MessageSquareOff,
  MoreHorizontal,
  Pencil,
  Pin,
  Share2,
  ThumbsDown,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Ban,
  VolumeX,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportPostModal } from "./report-post-modal";
import {
  blockUser,
  deletePost,
  followUser,
  hideFeedPost,
  muteUser,
  savePost,
  sharePost,
  unfollowUser,
  unsavePost,
  updatePost,
  type ApiSocialPost,
} from "@/lib/social/client-api";
import { useFeedPreferencesStore } from "@/store/feed-preferences-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { useSimpleLanguage } from "@/hooks/use-simple-language";

function postAbsoluteUrl(postId: string) {
  if (typeof window === "undefined") return `/feed/post/${postId}`;
  return `${window.location.origin}/feed/post/${postId}`;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
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
  const { s } = useSimpleLanguage();
  const { user } = useCurrentUser();
  const { data: session } = useAuthSession();
  const { requireAuth } = useAuthGate();
  const hidePost = useFeedPreferencesStore((st) => st.hidePost);
  const markNotInterestedAuthor = useFeedPreferencesStore((st) => st.markNotInterestedAuthor);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? "");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(Boolean(post.viewerState?.saved));

  const viewerId = user?.id || session?.user?.id;
  const isAuthor = Boolean(viewerId && (viewerId === post.authorId || viewerId === post.author.id));
  const commentsEnabled = post.commentsEnabled !== false;
  const hideLikeCount = Boolean(post.hideLikeCount);
  const isArchived = Boolean(post.archivedAt);
  const isPinned = Boolean(post.isPinned);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2200);
  }

  async function copyLink() {
    const ok = await copyText(postAbsoluteUrl(post.id));
    if (ok) showFeedback(t("socialFeed.actions.linkCopied"));
    else setError(t("socialFeed.actions.copyFailed"));
  }

  async function shareAction() {
    const url = postAbsoluteUrl(post.id);
    try {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: t("socialFeed.actions.shareTitle"),
            url,
            text: post.content?.slice(0, 120) || undefined,
          });
        } catch (err) {
          if ((err as Error)?.name === "AbortError") return;
        }
      }
      requireAuth(async () => {
        try {
          const data = await sharePost(post.id);
          const link = data.link || url;
          const ok = await copyText(link);
          if (ok) showFeedback(t("socialFeed.actions.linkCopied"));
        } catch {
          const ok = await copyText(url);
          if (ok) showFeedback(t("socialFeed.actions.linkCopied"));
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

  async function hideFromFeed() {
    requireAuth(async () => {
      try {
        await hideFeedPost(post.id, "HIDE");
        hidePost(post.id);
        onHidden?.(post.id);
        showFeedback(t("socialFeed.actions.hiddenFeedback"));
      } catch {
        hidePost(post.id);
        onHidden?.(post.id);
        showFeedback(t("socialFeed.actions.hiddenFeedback"));
      }
    });
  }

  async function notInterested() {
    requireAuth(async () => {
      try {
        const data = await hideFeedPost(post.id, "NOT_INTERESTED");
        markNotInterestedAuthor(post.author.id);
        hidePost(post.id);
        onHidden?.(post.id);
        showFeedback(
          data.persisted
            ? t("socialFeed.actions.notInterestedFeedback")
            : t("socialFeed.actions.hiddenFeedback")
        );
      } catch {
        hidePost(post.id);
        onHidden?.(post.id);
        showFeedback(t("socialFeed.actions.hiddenFeedback"));
      }
    });
  }

  async function patchPost(payload: Parameters<typeof updatePost>[1], successMsg: string) {
    setPending(true);
    setError(null);
    try {
      const data = await updatePost(post.id, payload);
      onUpdated?.(data.post);
      showFeedback(successMsg);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("socialFeed.actions.editFailed"));
    } finally {
      setPending(false);
    }
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

  const commonItems = (
    <>
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
    </>
  );

  const ownerItems = (
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
      <DropdownMenuLabel>{t("socialFeed.actions.audience")}</DropdownMenuLabel>
      <DropdownMenuItem
        onSelect={() => void patchPost({ visibility: "PUBLIC" }, s(t("socialFeed.actions.visibilityPublicDone")))}
      >
        <Globe className="h-4 w-4" aria-hidden />
        {s(t("socialFeed.actions.visibilityPublic"))}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          void patchPost({ visibility: "FOLLOWERS" }, s(t("socialFeed.actions.visibilityFollowersDone")))
        }
      >
        <Users className="h-4 w-4" aria-hidden />
        {s(t("socialFeed.actions.visibilityFollowers"))}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => void patchPost({ visibility: "PRIVATE" }, s(t("socialFeed.actions.visibilityPrivateDone")))}
      >
        <Lock className="h-4 w-4" aria-hidden />
        {s(t("socialFeed.actions.visibilityPrivate"))}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          void patchPost(
            { isPinned: !isPinned },
            isPinned ? t("socialFeed.actions.unpinDone") : t("socialFeed.actions.pinDone")
          )
        }
      >
        <Pin className="h-4 w-4" aria-hidden />
        {isPinned ? t("socialFeed.actions.unpin") : t("socialFeed.actions.pin")}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          void patchPost(
            { commentsEnabled: !commentsEnabled },
            commentsEnabled
              ? t("socialFeed.actions.commentsDisabledDone")
              : t("socialFeed.actions.commentsEnabledDone")
          )
        }
      >
        <MessageSquareOff className="h-4 w-4" aria-hidden />
        {commentsEnabled ? t("socialFeed.actions.disableComments") : t("socialFeed.actions.enableComments")}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          void patchPost(
            { hideLikeCount: !hideLikeCount },
            hideLikeCount ? t("socialFeed.actions.showLikesDone") : t("socialFeed.actions.hideLikesDone")
          )
        }
      >
        <HeartOff className="h-4 w-4" aria-hidden />
        {hideLikeCount ? t("socialFeed.actions.showLikes") : t("socialFeed.actions.hideLikes")}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          void patchPost(
            isArchived ? { unarchive: true } : { archive: true },
            isArchived ? t("socialFeed.actions.unarchiveDone") : t("socialFeed.actions.archiveDone")
          )
        }
      >
        <Archive className="h-4 w-4" aria-hidden />
        {isArchived ? t("socialFeed.actions.unarchive") : t("socialFeed.actions.archive")}
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
  );

  const otherItems = (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => void hideFromFeed()}>
        <EyeOff className="h-4 w-4" aria-hidden />
        {t("socialFeed.actions.hide")}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => void notInterested()}>
        <ThumbsDown className="h-4 w-4" aria-hidden />
        {t("socialFeed.actions.notInterested")}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          requireAuth(async () => {
            try {
              if (post.viewerState?.followingAuthor) {
                await unfollowUser(post.author.id);
                showFeedback(t("socialFeed.actions.unfollowDone"));
                onUpdated?.({
                  ...post,
                  viewerState: {
                    liked: Boolean(post.viewerState?.liked),
                    saved: Boolean(post.viewerState?.saved),
                    followingAuthor: false,
                  },
                });
              } else {
                await followUser(post.author.id);
                showFeedback(t("socialFeed.actions.followDone"));
                onUpdated?.({
                  ...post,
                  viewerState: {
                    liked: Boolean(post.viewerState?.liked),
                    saved: Boolean(post.viewerState?.saved),
                    followingAuthor: true,
                  },
                });
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : t("socialFeed.actions.unfollowFailed"));
            }
          })
        }
      >
        {post.viewerState?.followingAuthor ? (
          <UserMinus className="h-4 w-4" aria-hidden />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden />
        )}
        {post.viewerState?.followingAuthor ? t("socialFeed.actions.unfollow") : t("socialFeed.actions.follow")}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          requireAuth(async () => {
            try {
              await muteUser(post.author.id);
              hidePost(post.id);
              onHidden?.(post.id);
              showFeedback(t("socialFeed.actions.muteDone"));
            } catch (e) {
              setError(e instanceof Error ? e.message : t("socialFeed.actions.muteFailed"));
            }
          })
        }
      >
        <VolumeX className="h-4 w-4" aria-hidden />
        {t("socialFeed.actions.mute")}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() =>
          requireAuth(async () => {
            try {
              await blockUser(post.author.id);
              hidePost(post.id);
              onHidden?.(post.id);
              showFeedback(t("socialFeed.actions.blockDone"));
            } catch (e) {
              setError(e instanceof Error ? e.message : t("socialFeed.actions.blockFailed"));
            }
          })
        }
      >
        <Ban className="h-4 w-4" aria-hidden />
        {t("socialFeed.actions.block")}
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
  );

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl text-[var(--ep-fg-muted)] hover:bg-[var(--ep-bg-muted)] hover:text-[var(--ep-fg)]"
            aria-label={t("socialFeed.actions.more")}
            aria-haspopup="menu"
            data-testid="post-overflow-menu"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="max-h-[min(80vh,28rem)] overflow-y-auto">
          {isAuthor ? ownerItems : null}
          {commonItems}
          {!isAuthor ? otherItems : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {feedback ? (
        <span
          role="status"
          aria-live="polite"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-40 whitespace-nowrap rounded-md bg-[var(--ep-fg)] px-2.5 py-1 text-xs text-[var(--ep-bg)] shadow-md"
        >
          {feedback}
        </span>
      ) : null}
      {error && !editOpen && !deleteOpen ? (
        <p className="absolute right-0 top-[calc(100%+0.35rem)] z-40 max-w-[16rem] text-xs text-red-600" role="alert">
          {error}
        </p>
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
            className="w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-3 text-sm text-[var(--ep-fg)] outline-none focus:ring-2 focus:ring-[var(--ep-ring)]"
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
            <DialogTitle>{t("socialFeed.actions.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("socialFeed.actions.deleteConfirmBody")}</DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={pending}>
              {t("socialFeed.actions.delete")}
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
