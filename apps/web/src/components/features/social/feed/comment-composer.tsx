"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/lib/social/client-api";

export function CommentComposer({ postId, onCreated }: { postId: string; onCreated?: () => void }) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setPending(true);
    try {
      await createComment(postId, content);
      setContent("");
      onCreated?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escreva um comentário..." rows={2} className="flex-1" />
      <Button size="sm" onClick={submit} disabled={pending}>
        Enviar
      </Button>
    </div>
  );
}
