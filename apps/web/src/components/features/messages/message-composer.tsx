"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/lib/upload/client";
import {
  MessageAttachmentUploader,
  validateChatAttachment,
  type PendingAttachment,
} from "@/components/features/messages/message-attachment-uploader";

export type OutgoingAttachment = {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
};

export function MessageComposer({
  onSend,
  disabled,
}: {
  onSend: (content: string, attachments?: OutgoingAttachment[]) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function handleSelect(file: File) {
    const err = validateChatAttachment(file);
    if (err) {
      setUploadError(err);
      return;
    }
    setUploadError("");
    setPending({ file });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value && !pending) return;

    setUploadError("");
    let attachments: OutgoingAttachment[] | undefined;

    if (pending) {
      setUploading(true);
      try {
        const uploaded = await uploadFile(pending.file, "chat_attachment");
        attachments = [
          {
            fileName: pending.file.name,
            fileUrl: uploaded.url,
            mimeType: uploaded.mimeType,
            fileSize: uploaded.sizeBytes,
            storageProvider: uploaded.provider ?? "local_dev",
          },
        ];
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha no upload.";
        setUploadError(msg.includes("não configurado") ? "Upload não configurado (UPLOAD_NOT_CONFIGURED)." : msg);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    setText("");
    setPending(null);
    await onSend(value, attachments);
  }

  return (
    <div className="border-t">
      {uploadError && <p className="px-3 pt-2 text-xs text-red-600">{uploadError}</p>}
      <form onSubmit={submit} className="flex items-center gap-2 p-3">
        <MessageAttachmentUploader
          pending={pending}
          uploading={uploading}
          onSelect={handleSelect}
          onRemove={() => setPending(null)}
          disabled={disabled}
        />
        <Input
          className="flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={disabled || uploading}
          maxLength={4000}
        />
        <Button type="submit" disabled={disabled || uploading || (!text.trim() && !pending)}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
