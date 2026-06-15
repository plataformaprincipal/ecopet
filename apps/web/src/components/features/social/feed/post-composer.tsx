"use client";

import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost, uploadSocialMedia } from "@/lib/social/client-api";

export function PostComposer({ onPublished }: { onPublished?: () => void }) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<{ fileUrl: string; fileName: string; mimeType: string; fileSize: number; storageProvider: string }[]>([]);

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
      setError("Informe texto ou mídia.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await createPost({ content, media: mediaFiles });
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
      <Textarea
        placeholder="O que seu pet está aprontando hoje? Use #hashtags"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={5000}
      />
      {mediaFiles.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{mediaFiles.length} arquivo(s) anexado(s)</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <label className="cursor-pointer">
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
          <span className="inline-flex items-center gap-1 text-sm text-ecopet-primary">
            <ImagePlus className="h-4 w-4" /> Mídia
          </span>
        </label>
        <Button onClick={publish} disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Publicar
        </Button>
      </div>
    </div>
  );
}
