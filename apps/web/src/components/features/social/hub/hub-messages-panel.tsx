"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversationsPolling } from "@/hooks/use-message-polling";
import type { ConversationItem } from "@/lib/messages/client-api";
import { cn } from "@/lib/utils";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function otherParticipant(c: ConversationItem) {
  return c.participants[0] ?? null;
}

export function HubMessagesPanel({
  onOpenConversation,
  className,
}: {
  onOpenConversation: (c: ConversationItem) => void;
  className?: string;
}) {
  const { items, loading } = useConversationsPolling(true);
  const recent = items.slice(0, 6);

  return (
    <section
      className={cn(
        "rounded-[20px] border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60",
        className
      )}
      aria-label="Mensagens rápidas"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
          <MessageSquare className="h-5 w-5 text-ecopet-green" aria-hidden />
          Mensagens
        </h2>
        <Link href="/dashboard/messages" className="text-xs font-medium text-ecopet-green hover:underline">
          Abrir tudo
        </Link>
      </header>

      {loading && recent.length === 0 ? (
        <div className="space-y-2" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">Nenhuma conversa ainda.</p>
      ) : (
        <ul className="space-y-1">
          {recent.map((c) => {
            const other = otherParticipant(c);
            const name = c.title ?? other?.name ?? "Conversa";
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onOpenConversation(c)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-zinc-50 dark:hover:bg-white/5"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={other?.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900"
                      aria-label="Online"
                    />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-zinc-900 dark:text-white">{name}</span>
                      {c.lastMessage ? (
                        <span className="shrink-0 text-[10px] text-zinc-400">{timeAgo(c.lastMessage.createdAt)}</span>
                      ) : null}
                    </span>
                    <span className="truncate text-xs text-zinc-500">
                      {c.lastMessage?.content ?? "Sem mensagens"}
                    </span>
                  </span>
                  {c.unreadCount > 0 ? (
                    <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ecopet-green px-1.5 text-[10px] font-semibold text-white">
                      {c.unreadCount}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
