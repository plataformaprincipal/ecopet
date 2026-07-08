"use client";

import { cn } from "@/lib/utils";

export type AIMessageRole = "user" | "assistant" | "system";

type Props = {
  role: AIMessageRole;
  content: string;
  timestamp?: string;
  className?: string;
};

export function AIMessage({ role, content, timestamp, className }: Props) {
  const isUser = role === "user";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start", className)}
      data-role={role}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
          isUser ? "bg-ecopet-green text-white" : "bg-muted text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {timestamp && (
          <time className="mt-1 block text-[10px] opacity-70" dateTime={timestamp}>
            {new Date(timestamp).toLocaleString("pt-BR")}
          </time>
        )}
      </div>
    </div>
  );
}
