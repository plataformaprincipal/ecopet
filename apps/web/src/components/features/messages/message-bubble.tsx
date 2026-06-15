"use client";

import { Flag, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/messages/client-api";
import { cn } from "@/lib/utils";

export function MessageBubble({
  message,
  isMine,
  onReport,
  onBlock,
}: {
  message: ChatMessage;
  isMine?: boolean;
  onReport: () => void;
  onBlock: () => void;
}) {
  const mine = isMine;
  return (
    <div className={cn("group flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
          mine ? "bg-ecopet-green text-white" : "bg-muted",
          message.isDeleted && "italic opacity-70"
        )}
      >
        {!mine && <p className="mb-1 text-[10px] font-semibold opacity-70">{message.sender.name}</p>}
        <p>{message.content}</p>
        {message.attachments?.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((a) => {
              const isImage = a.mimeType?.startsWith("image/");
              return isImage ? (
                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={a.fileName}
                    className="max-h-48 max-w-full rounded-lg object-cover"
                  />
                </a>
              ) : (
                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block text-xs underline">
                  📎 {a.fileName}
                </a>
              );
            })}
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 text-[10px] opacity-70">
          <span>{new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          {message.isEdited && <span>(editada)</span>}
        </div>
        {!mine && !message.isDeleted && (
          <div className="mt-1 hidden gap-1 group-hover:flex">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onReport} aria-label="Denunciar">
              <Flag className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onBlock} aria-label="Bloquear">
              <Ban className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
