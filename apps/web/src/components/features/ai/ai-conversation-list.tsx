"use client";

import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

export type AIConversationItem = {
  id: string;
  title?: string | null;
  agentName?: string | null;
  updatedAt?: string;
  messageCount?: number;
};

type Props = {
  items: AIConversationItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

export function AIConversationList({ items, selectedId, onSelect, className }: Props) {
  if (items.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa registrada.</p>;
  }

  return (
    <ul className={cn("divide-y", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect?.(item.id)}
            className={cn(
              "flex w-full items-start gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-muted",
              selectedId === item.id && "bg-muted"
            )}
          >
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.title ?? "Conversa"}</p>
              <p className="text-xs text-muted-foreground">
                {item.agentName && `${item.agentName} · `}
                {item.messageCount != null && `${item.messageCount} mensagens`}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
