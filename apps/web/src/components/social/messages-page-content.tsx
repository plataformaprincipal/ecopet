"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Sparkles, Smile, Send } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { SocialSubNav } from "@/components/social/social-sub-nav";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSocialStore } from "@/store/social-store";
import { formatSocialTime } from "@/lib/social/config";
import { cn } from "@/lib/utils";

export function MessagesPageContent() {
  const conversations = useSocialStore((s) => s.conversations);
  const messages = useSocialStore((s) => s.messages);
  const activeId = useSocialStore((s) => s.activeConversationId);
  const loadConversations = useSocialStore((s) => s.loadConversations);
  const loadMessages = useSocialStore((s) => s.loadMessages);
  const setActiveConversation = useSocialStore((s) => s.setActiveConversation);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <>
      <AppHeader title="Mensagens" />
      <SocialSubNav />
      <main className="mx-auto flex max-w-4xl flex-1 flex-col lg:h-[calc(100vh-8rem)] lg:flex-row lg:overflow-hidden lg:p-4 lg:gap-4">
        {/* Lista de conversas */}
        <div className={cn("flex flex-col border-ecopet-gray/10 lg:w-80 lg:rounded-2xl lg:border lg:bg-white lg:dark:bg-[#0f1419]", activeId && "hidden lg:flex")}>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecopet-gray" />
              <Input placeholder="Buscar conversas..." className="pl-10" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveConversation(conv.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-ecopet-gray/5 px-4 py-3 text-left transition hover:bg-ecopet-green/5",
                  activeId === conv.id && "bg-ecopet-green/10"
                )}
              >
                <div className="relative">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image src={conv.participant.avatar} alt="" fill className="object-cover" />
                  </div>
                  {conv.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-ecopet-green" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{conv.participant.name}</span>
                    <span className="text-[10px] text-ecopet-gray">{formatSocialTime(conv.lastMessageAt)}</span>
                  </div>
                  <p className="truncate text-xs text-ecopet-gray">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <Badge className="bg-ecopet-green text-white">{conv.unread}</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className={cn("flex flex-1 flex-col lg:rounded-2xl lg:border lg:border-ecopet-gray/10 lg:bg-white lg:dark:bg-[#0f1419]", !activeId && "hidden lg:flex")}>
          {!activeConv ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-ecopet-gray">
              <div>
                <Send className="mx-auto h-12 w-12 text-ecopet-green/40" />
                <p className="mt-4">Selecione uma conversa para começar</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-ecopet-gray/10 px-4 py-3">
                <button type="button" className="lg:hidden text-sm text-ecopet-green" onClick={() => setActiveConversation(null)}>← Voltar</button>
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image src={activeConv.participant.avatar} alt="" fill className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold">{activeConv.participant.name}</p>
                  {activeConv.online && <p className="text-xs text-ecopet-green">Online</p>}
                </div>
                <Link href={`/social/perfil/${activeConv.participant.id}`} className="ml-auto text-xs text-ecopet-green hover:underline">Ver perfil</Link>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.isMine ? "justify-end" : "justify-start")}>
                    {msg.type === "ai" ? (
                      <div className="max-w-[85%] rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600"><Sparkles className="h-3 w-3" /> Sugestão IA</span>
                        {msg.content}
                      </div>
                    ) : (
                      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm", msg.isMine ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10 dark:bg-white/10")}>
                        {msg.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-ecopet-gray/10 p-3">
                <div className="mb-2 flex gap-2 overflow-x-auto">
                  {["Confirmado! ✅", "Obrigado!", "Pode ser amanhã?"].map((s) => (
                    <button key={s} type="button" className="shrink-0 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-xs text-violet-700" onClick={() => setDraft(s)}>
                      <Sparkles className="mr-1 inline h-3 w-3" />{s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-lg p-2 hover:bg-ecopet-gray/10"><Smile className="h-5 w-5 text-ecopet-gray" /></button>
                  <Input placeholder="Mensagem..." value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1" />
                  <button type="button" className="rounded-xl bg-ecopet-green p-2.5 text-white"><Send className="h-5 w-5" /></button>
                </div>
                <p className="mt-2 text-center text-[10px] text-ecopet-gray">Tradução automática disponível · IA integrada em breve</p>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
