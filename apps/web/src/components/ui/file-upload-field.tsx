"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UploadPurpose } from "@/lib/upload/cloudinary";
import { uploadFile } from "@/lib/upload/client";

type FileUploadFieldProps = {
  purpose: UploadPurpose;
  label: string;
  value?: string | null;
  onChange: (url: string, meta?: { mimeType: string; sizeBytes: number }) => void;
  accept?: string;
  allowManualUrl?: boolean;
  manualUrlLabel?: string;
};

export function FileUploadField({
  purpose,
  label,
  value,
  onChange,
  accept,
  allowManualUrl = true,
  manualUrlLabel = "Ou informe URL",
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadFile(file, purpose);
      onChange(result.url, { mimeType: result.mimeType, sizeBytes: result.sizeBytes });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
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
      </div>
      {allowManualUrl && (
        <Input
          placeholder={manualUrlLabel}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
