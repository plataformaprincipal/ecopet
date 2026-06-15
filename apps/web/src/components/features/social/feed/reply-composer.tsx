"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/lib/social/client-api";

export function ReplyComposer({
  postId,
  parentCommentId,
  onCreated,
}: {
  postId: string;
  parentCommentId: string;
  onCreated?: () => void;
}) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setPending(true);
    try {
      await createComment(postId, content, parentCommentId);
      setContent("");
      onCreated?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="ml-10 flex gap-2">
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Sua resposta..." rows={2} className="flex-1" />
      <Button size="sm" onClick={submit} disabled={pending}>
        Responder
      </Button>
    </div>
  );
}
