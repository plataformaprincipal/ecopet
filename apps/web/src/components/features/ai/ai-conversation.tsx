"use client";

import { AIMessage } from "@/components/features/ai/ai-message";
import { AIEmptyState } from "@/components/features/ai/ai-empty-state";
import { cn } from "@/lib/utils";

export type AIConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
};

type Props = {
  messages: AIConversationMessage[];
  className?: string;
};

export function AIConversation({ messages, className }: Props) {
  if (messages.length === 0) {
    return <AIEmptyState />;
  }

  return (
    <div className={cn("flex flex-col gap-3 overflow-y-auto p-4", className)}>
      {messages.map((m) => (
        <AIMessage key={m.id} role={m.role} content={m.content} timestamp={m.createdAt} />
      ))}
    </div>
  );
}
