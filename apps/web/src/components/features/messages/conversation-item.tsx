"use client";

import { cn } from "@/lib/utils";
import { UnreadBadge } from "@/components/features/messages/unread-badge";
import type { ConversationItem } from "@/lib/messages/client-api";

const TYPE_LABELS: Record<string, string> = {
  DIRECT: "Direct",
  CLIENT_PARTNER: "Parceiro",
  CLIENT_ONG: "ONG",
  SUPPORT: "Suporte",
  SYSTEM: "Sistema",
};

export function ConversationItemRow({
  conversation,
  active,
  onClick,
}: {
  conversation: ConversationItem;
  active?: boolean;
  onClick: () => void;
}) {
  const title =
    conversation.title ||
    conversation.participants.map((p) => p.name).join(", ") ||
    "Conversa";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition hover:bg-muted/50",
        active && "bg-ecopet-green/10"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-sm">{title}</p>
          <UnreadBadge count={conversation.unreadCount} />
        </div>
        <p className="text-xs text-muted-foreground">{TYPE_LABELS[conversation.type] ?? conversation.type}</p>
        {conversation.lastMessage && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
}
