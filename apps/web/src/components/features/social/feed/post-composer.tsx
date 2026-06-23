"use client";

import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost, uploadSocialMedia } from "@/lib/social/client-api";
import { useTranslation } from "@/providers/i18n-provider";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getAllowedPostTypes } from "@/lib/social/persona-permissions";
import type { SocialPostType } from "@prisma/client";

export function PostComposer({ onPublished }: { onPublished?: () => void }) {
  const { t } = useTranslation();
  const { requireAuth, isAuthenticated } = useAuthGate();
  const { user } = useCurrentUser();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<SocialPostType>("GENERAL");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<{ fileUrl: string; fileName: string; mimeType: string; fileSize: number; storageProvider: string }[]>([]);

  const allowedTypes = user
    ? getAllowedPostTypes({ id: user.id, role: user.role as import("@prisma/client").UserRole, accountStatus: (user.accountStatus ?? "ACTIVE") as import("@prisma/client").AccountStatus, name: user.name, email: user.email })
    : [];

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => requireAuth()}
        className="w-full rounded-xl border border-ecopet-gray/15 bg-white p-4 text-left text-sm text-muted-foreground shadow-sm transition hover:border-ecopet-green/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green"
        aria-label={t("socialFeed.composer.loginToPost")}
      >
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
        { fileUrl: upload.url, fileName: upload.fileName, mimeType: upload.mimeType, fileSize: upload.sizeBytes, storageProvider: upload.provider },
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
      await createPost({ content, type: postType, media: mediaFiles });
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
    <div className="rounded-xl border border-ecopet-gray/15 bg-white p-4 shadow-sm">
      {allowedTypes.length > 1 && (
        <div className="mb-3">
          <label htmlFor="post-type" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("socialFeed.composer.typeLabel")}
          </label>
          <select
            id="post-type"
            value={postType}
            onChange={(e) => setPostType(e.target.value as SocialPostType)}
            className="w-full rounded-lg border border-ecopet-gray/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green"
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
      />
      {mediaFiles.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{mediaFiles.length} arquivo(s) anexado(s)</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <label className="cursor-pointer">
          <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" onChange={handleFile} />
          <span className="inline-flex items-center gap-1 text-sm text-ecopet-primary">
            <ImagePlus className="h-4 w-4" aria-hidden /> {t("socialFeed.composer.media")}
          </span>
        </label>
        <Button onClick={publish} disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          {t("socialFeed.composer.publish")}
        </Button>
      </div>
    </div>
  );
}
