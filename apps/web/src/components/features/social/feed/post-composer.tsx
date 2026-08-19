"use client";

import { useState } from "react";
import { Globe, ImagePlus, Loader2, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPost, uploadSocialMedia } from "@/lib/social/client-api";
import { useTranslation } from "@/providers/i18n-provider";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getAllowedPostTypes } from "@/lib/social/persona-permissions";
import type { SocialPostType, SocialPostVisibility } from "@prisma/client";
import { cn } from "@/lib/utils";

const AUDIENCE: { id: SocialPostVisibility; icon: typeof Globe; labelKey: string }[] = [
  { id: "PUBLIC", icon: Globe, labelKey: "socialFeed.composer.audiencePublic" },
  { id: "FOLLOWERS", icon: Users, labelKey: "socialFeed.composer.audienceFollowers" },
  { id: "PRIVATE", icon: Lock, labelKey: "socialFeed.composer.audiencePrivate" },
];

export function PostComposer({ onPublished }: { onPublished?: () => void }) {
  const { t } = useTranslation();
  const { requireAuth, isAuthenticated } = useAuthGate();
  const { user } = useCurrentUser();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<SocialPostType>("GENERAL");
  const [visibility, setVisibility] = useState<SocialPostVisibility>("PUBLIC");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<
    { fileUrl: string; fileName: string; mimeType: string; fileSize: number; storageProvider: string }[]
  >([]);

  const allowedTypes = user
    ? getAllowedPostTypes({
        id: user.id,
        role: user.role as import("@prisma/client").UserRole,
        accountStatus: (user.accountStatus ?? "ACTIVE") as import("@prisma/client").AccountStatus,
        name: user.name,
        email: user.email,
      })
    : [];

  const initials = (user?.name ?? "U").slice(0, 2).toUpperCase();

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => requireAuth()}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--ep-fg-muted)] transition hover:bg-[var(--ep-bg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ep-ring)]"
        aria-label={t("socialFeed.composer.loginToPost")}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ep-bg-muted)] text-xs font-semibold">
          ?
        </span>
        {t("socialFeed.composer.loginToPost")}
      </button>
    );
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const upload = await uploadSocialMedia(file);
      setMediaFiles((prev) => [
        ...prev,
        {
          fileUrl: upload.url,
          fileName: upload.fileName,
          mimeType: upload.mimeType,
          fileSize: upload.sizeBytes,
          storageProvider: upload.provider,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    }
  }

  async function publish() {
    if (!content.trim() && mediaFiles.length === 0) {
      setError(t("socialFeed.composer.validationEmpty"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      await createPost({ content, type: postType, visibility, media: mediaFiles });
      setContent("");
      setMediaFiles([]);
      onPublished?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar");
    } finally {
      setPending(false);
    }
  }

  return (
    <div id="social-composer" className="flex gap-3">
      <Avatar className="mt-1 h-10 w-10 shrink-0">
        <AvatarImage src={undefined} alt="" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        {allowedTypes.length > 1 && (
          <div className="mb-2">
            <label htmlFor="post-type" className="sr-only">
              {t("socialFeed.composer.typeLabel")}
            </label>
            <select
              id="post-type"
              value={postType}
              onChange={(e) => setPostType(e.target.value as SocialPostType)}
              className="rounded-lg border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-2 py-1 text-xs text-[var(--ep-fg)]"
            >
              {allowedTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`socialFeed.postTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>
        )}
        <Textarea
          placeholder={t("socialFeed.composer.placeholder")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={5000}
          aria-label={t("socialFeed.composer.placeholder")}
          className="min-h-[72px] resize-none border-0 bg-transparent p-0 text-[15px] shadow-none focus-visible:ring-0"
        />
        {mediaFiles.length > 0 && (
          <p className="mt-2 text-xs text-[var(--ep-fg-muted)]">{mediaFiles.length} arquivo(s) anexado(s)</p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-[var(--ep-fg-muted)] hover:bg-[var(--ep-bg-muted)]">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                className="hidden"
                onChange={handleFile}
              />
              <ImagePlus className="h-5 w-5" aria-hidden />
              <span className="sr-only">{t("socialFeed.composer.media")}</span>
            </label>
            <div className="flex rounded-full border border-[var(--ep-border)] p-0.5" role="radiogroup" aria-label={t("socialFeed.actions.audience")}>
              {AUDIENCE.map((opt) => {
                const Icon = opt.icon;
                const active = visibility === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setVisibility(opt.id)}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-xs font-medium",
                      active
                        ? "bg-[var(--ep-bg-muted)] text-[var(--ep-fg)]"
                        : "text-[var(--ep-fg-muted)] hover:text-[var(--ep-fg)]"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {t(opt.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
          <Button onClick={() => void publish()} disabled={pending} className="min-h-11 rounded-full px-5">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {t("socialFeed.composer.publish")}
          </Button>
        </div>
      </div>
    </div>
  );
}
