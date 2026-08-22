"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadSocialStoryMedia } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void;
};

export function StoryComposer({ open, onClose, onPublished }: Props) {
  const { requireAuth, isAuthenticated } = useAuthGate();
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0];
    if (!next) return;
    setError("");
    setFile(next);
    setFilePreview(URL.createObjectURL(next));
  }

  async function publish() {
    if (!isAuthenticated) {
      requireAuth(() => void publish());
      return;
    }
    if (!file) {
      setError("Adicione uma imagem ou vídeo.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const upload = await uploadSocialStoryMedia(file);
      const res = await fetch("/api/social/stories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: upload.url,
          mimeType: upload.mimeType,
          fileSize: upload.sizeBytes,
          content: caption,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "Não foi possível publicar o story.");
      }
      onPublished?.();
      onClose();
      setFile(null);
      setFilePreview(null);
      setCaption("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível publicar o story.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal aria-label="Seu story">
      <div className="w-full max-w-md rounded-2xl bg-[var(--ep-bg-elevated)] p-4 text-[var(--ep-fg)] shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Seu story</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <label className={cn("flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--ep-border)] bg-[var(--ep-bg)]", filePreview && "overflow-hidden")}>
          {filePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={filePreview} alt="Pré-visualização" className="max-h-64 w-full object-contain" />
          ) : (
            <>
              <Plus className="h-8 w-8 text-ecopet-green" />
              <span className="mt-2 text-xs text-[var(--ep-fg-muted)]">Adicionar mídia</span>
            </>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="sr-only" onChange={(e) => void handleFile(e)} />
        </label>
        <textarea
          className="mt-3 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm"
          rows={2}
          maxLength={200}
          placeholder="Texto opcional"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={pending || !file} onClick={() => void publish()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
