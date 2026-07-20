"use client";

import { useEffect, useRef } from "react";
import type { EccoPetTool } from "@/lib/public/eccopet-tools";
import { AIMessageBubble } from "./ai-message-bubble";
import { AIPromptBox } from "./ai-prompt-box";
import { AIEmptyState } from "./ai-empty-state";
import { AIDisclaimer } from "./ai-disclaimer";
import type { AIMessage } from "./types";

export function AIChatWindow({
  messages,
  loading,
  conversationId,
  onSend,
  onCancel,
  onRegenerate,
  onSelectTool,
  onAttachAttempt,
  suggestions,
}: {
  messages: AIMessage[];
  loading: boolean;
  conversationId?: string | null;
  onSend: (text: string) => void;
  onCancel?: () => void;
  onRegenerate?: () => void;
  onSelectTool: (tool: EccoPetTool) => void;
  onAttachAttempt?: () => void;
  suggestions?: string[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant" && !m.pending)?.id;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto" aria-live="polite">
        {isEmpty ? (
          <AIEmptyState
            onSendSuggestion={onSend}
            onSelectTool={onSelectTool}
            suggestions={suggestions}
          />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
            {messages.map((m) => (
              <AIMessageBubble
                key={m.id}
                message={m}
                conversationId={conversationId ?? undefined}
                showRegenerate={Boolean(onRegenerate) && m.id === lastAssistantId && !loading}
                onRegenerate={onRegenerate}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200/60 bg-white/40 px-4 py-3 backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/30">
        <div className="mx-auto w-full max-w-3xl space-y-2">
          <AIPromptBox
            onSend={onSend}
            disabled={loading}
            loading={loading}
            onCancel={onCancel}
            onAttachAttempt={onAttachAttempt}
          />
          <AIDisclaimer />
        </div>
      </div>
    </div>
  );
}
