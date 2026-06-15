"use client";

import { useRef } from "react";
import { Paperclip, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHAT_ATTACHMENT_MAX_BYTES, CHAT_ATTACHMENT_MIMES } from "@/lib/messages/constants";

export type PendingAttachment = {
  file: File;
  previewUrl?: string;
};

export function validateChatAttachment(file: File): string | null {
  if (!CHAT_ATTACHMENT_MIMES.includes(file.type as (typeof CHAT_ATTACHMENT_MIMES)[number])) {
    return "Tipo não permitido. Use JPEG, PNG, WebP ou PDF.";
  }
  if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
    return "Arquivo excede 10 MB.";
  }
  return null;
}

export function MessageAttachmentUploader({
  pending,
  uploading,
  onSelect,
  onRemove,
  disabled,
}: {
  pending: PendingAttachment | null;
  uploading?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={CHAT_ATTACHMENT_MIMES.join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        aria-label="Anexar arquivo"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
      </Button>
      {pending && (
        <div className="flex max-w-[12rem] items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
          <span className="truncate">{pending.file.name}</span>
          <button type="button" onClick={onRemove} aria-label="Remover anexo">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
