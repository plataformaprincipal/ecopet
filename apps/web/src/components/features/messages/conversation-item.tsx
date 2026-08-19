"use client";

import { cn } from "@/lib/utils";
import { UnreadBadge } from "@/components/features/messages/unread-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationItem } from "@/lib/messages/client-api";

function formatWhen(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function ConversationItemRow({
  conversation,
  active,
  onClick,
}: {
  conversation: ConversationItem;
  active?: boolean;
  onClick: () => void;
}) {
  const other = conversation.participants[0];
  const title = conversation.title || conversation.participants.map((p) => p.name).join(", ") || "Conversa";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--ep-bg-muted)]",
        active && "bg-[var(--ep-bg-muted)]"
      )}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={other?.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{title.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-[var(--ep-fg)]">{title}</p>
          <span className="shrink-0 text-[11px] text-[var(--ep-fg-muted)]">
            {formatWhen(conversation.lastMessage?.createdAt)}
          </span>
        </div>
        {conversation.lastMessage ? (
          <p className="mt-0.5 truncate text-xs text-[var(--ep-fg-muted)]">
            {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-[var(--ep-fg-muted)]">Sem mensagens ainda</p>
        )}
      </div>
      <UnreadBadge count={conversation.unreadCount} />
    </button>
  );
}
