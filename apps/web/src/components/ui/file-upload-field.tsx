"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UploadPurpose } from "@/lib/storage/upload-constraints";
import { uploadFile } from "@/lib/upload/client";

type FileUploadFieldProps = {
  purpose: UploadPurpose;
  label: string;
  value?: string | null;
  onChange: (url: string, meta?: { mimeType: string; sizeBytes: number }) => void;
  accept?: string;
  allowManualUrl?: boolean;
  manualUrlLabel?: string;
  previewAlt?: string;
  fieldId?: string;
};

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) || url.includes("cloudinary.com");
}

export function FileUploadField({
  purpose,
  label,
  value,
  onChange,
  accept,
  allowManualUrl = true,
  manualUrlLabel = "Ou informe URL",
  previewAlt,
  fieldId,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const id = fieldId ?? `upload-${purpose}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess(false);
    setProgress(0);
    try {
      const result = await uploadFile(file, purpose, {
        onProgress: (pct) => setProgress(pct),
      });
      onChange(result.url, { mimeType: result.mimeType, sizeBytes: result.sizeBytes });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }

  const imageAlt = previewAlt ?? `Pré-visualização: ${label}`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="hidden"
          accept={accept}
          aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Enviando..." : "Selecionar arquivo"}
        </Button>
        {value && (
          <a href={value} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
            Ver arquivo
          </a>
        )}
        {success && !uploading && !error && (
          <span className="text-xs font-medium text-green-600" role="status">
            Enviado ✓
          </span>
        )}
      </div>
      {uploading && (
        <div className="space-y-1" role="status" aria-live="polite">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-ecopet-green transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Enviando… {progress}%</p>
        </div>
      )}
      {value && isImageUrl(value) && (
        <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
          <Image src={value} alt={imageAlt} fill className="object-cover" unoptimized />
        </div>
      )}
      {allowManualUrl && (
        <Input
          placeholder={manualUrlLabel}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hintId}
        />
      )}
      <p id={hintId} className="text-xs text-muted-foreground">
        Formatos aceitos conforme o campo. A imagem terá texto alternativo descritivo na vitrine.
      </p>
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
