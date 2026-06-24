"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Paperclip, Smile, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMessagesPolling } from "@/hooks/use-message-polling";
import { messagesApi, type ConversationItem } from "@/lib/messages/client-api";
import { uploadSocialMedia } from "@/lib/social/client-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

const EMOJIS = ["🐶", "🐱", "❤️", "🐾", "😍", "👍", "🎉", "🙏", "😂", "🥰", "🦴", "✅"];

export function HubChatDrawer({
  conversation,
  onClose,
}: {
  conversation: ConversationItem | null;
  onClose: () => void;
}) {
  const { user } = useCurrentUser();
  const conversationId = conversation?.id ?? null;
  const { messages, refresh, setMessages } = useMessagesPolling(conversationId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  if (!conversation) return null;

  const other = conversation.participants[0];
  const name = conversation.title ?? other?.name ?? "Conversa";

  async function handleSend() {
    const text = input.trim();
    if (!text || !conversationId || sending) return;
    setInput("");
    setSending(true);
    try {
      const { message } = await messagesApi.sendMessage(conversationId, text);
      setMessages((m) => [...m, message]);
    } catch {
      void refresh();
    } finally {
      setSending(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    setSending(true);
    try {
      const up = await uploadSocialMedia(file);
      const { message } = await messagesApi.sendMessage(conversationId, file.name, [
        {
          fileName: up.fileName,
          fileUrl: up.url,
          mimeType: up.mimeType,
          fileSize: up.sizeBytes,
          storageProvider: up.provider,
        },
      ]);
      setMessages((m) => [...m, message]);
    } catch {
      void refresh();
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onInputChange(v: string) {
    setInput(v);
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 1200);
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <aside
        className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-900"
        role="dialog"
        aria-label={`Conversa com ${name}`}
      >
        <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-white/10">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={other?.avatarUrl ?? undefined} alt="" />
              <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-zinc-900 dark:text-white">{name}</p>
            <p className="text-xs text-emerald-500">online</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar conversa" className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-white/10">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950/40">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">Inicie a conversa enviando uma mensagem.</p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      mine ? "bg-ecopet-green text-white" : "bg-white text-zinc-800 shadow-sm dark:bg-white/10 dark:text-zinc-100"
                    )}
                  >
                    {m.attachments.length > 0 ? (
                      <div className="mb-1 space-y-1">
                        {m.attachments.map((a) =>
                          a.mimeType?.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={a.id} src={a.url} alt={a.fileName} className="max-h-48 rounded-lg" />
                          ) : (
                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline">
                              <Paperclip className="h-3 w-3" aria-hidden /> {a.fileName}
                            </a>
                          )
                        )}
                      </div>
                    ) : null}
                    {m.isDeleted ? <span className="italic opacity-70">Mensagem removida</span> : m.content}
                    <span className={cn("mt-1 block text-right text-[10px]", mine ? "text-white/70" : "text-zinc-400")}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {typing ? <p className="text-xs italic text-zinc-400">digitando...</p> : null}
        </div>

        {showEmoji ? (
          <div className="flex flex-wrap gap-1 border-t border-zinc-100 p-2 dark:border-white/10">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setInput((v) => v + e)}
                className="rounded-lg p-1.5 text-lg hover:bg-zinc-100 dark:hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2 border-t border-zinc-100 p-3 dark:border-white/10">
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept="image/*,.pdf,.doc,.docx" />
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => fileRef.current?.click()} aria-label="Anexar arquivo">
            <Paperclip className="h-5 w-5" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowEmoji((v) => !v)} aria-label="Emojis">
            <Smile className="h-5 w-5" aria-hidden />
          </Button>
          <input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSend()}
            placeholder="Mensagem..."
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-ecopet-green focus:outline-none dark:border-white/10 dark:bg-zinc-950"
            aria-label="Escrever mensagem"
          />
          <Button size="icon" className="rounded-xl" onClick={() => void handleSend()} disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </aside>
    </>
  );
}
