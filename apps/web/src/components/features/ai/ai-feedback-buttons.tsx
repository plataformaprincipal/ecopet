"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp, Copy } from "lucide-react";

type Props = {
  conversationId?: string;
  messageId?: string;
  contentToCopy?: string;
};

export function AIFeedbackButtons({ conversationId, messageId, contentToCopy }: Props) {
  const [sent, setSent] = useState<"up" | "down" | null>(null);

  async function send(positive: boolean) {
    setSent(positive ? "up" : "down");
    await fetch("/api/ai/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, messageId, positive }),
    }).catch(() => undefined);
  }

  async function copy() {
    if (!contentToCopy) return;
    await navigator.clipboard.writeText(contentToCopy).catch(() => undefined);
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        aria-label="Feedback positivo"
        disabled={sent !== null}
        onClick={() => void send(true)}
        className="rounded p-1 text-zinc-500 hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 dark:hover:bg-zinc-800"
      >
        <ThumbsUp className={`h-3.5 w-3.5 ${sent === "up" ? "text-emerald-600" : ""}`} />
      </button>
      <button
        type="button"
        aria-label="Feedback negativo"
        disabled={sent !== null}
        onClick={() => void send(false)}
        className="rounded p-1 text-zinc-500 hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 dark:hover:bg-zinc-800"
      >
        <ThumbsDown className={`h-3.5 w-3.5 ${sent === "down" ? "text-red-600" : ""}`} />
      </button>
      {contentToCopy && (
        <button
          type="button"
          aria-label="Copiar resposta"
          onClick={() => void copy()}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 dark:hover:bg-zinc-800"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
