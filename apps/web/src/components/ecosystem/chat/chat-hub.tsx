"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, Send, Paperclip, ImageIcon, FileText, Tag, Sparkles,
  MessageCircle, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CustomQuoteCard } from "../quotes/custom-quote-card";
import type { ChatConversation, ChatMessage } from "@/lib/ecosystem/types";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "@/lib/ecosystem/mock-data";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  product_inquiry: "Produto", service_inquiry: "Serviço", custom_quote: "Orçamento",
  support: "Suporte", scheduling: "Agendamento", complaint: "Reclamação",
  negotiation: "Negociação", system_support: "Sistema ECOPET", adoption: "Adoção",
  donation: "Doação", volunteer: "Voluntário", partnership: "Parceria",
};

interface ChatHubProps {
  role?: "client" | "partner" | "ngo" | "system";
  initialConversationId?: string;
  showQuoteBuilder?: boolean;
}

export function ChatHub({ role = "client", initialConversationId }: ChatHubProps) {
  const conversations = MOCK_CONVERSATIONS;
  const [activeId, setActiveId] = useState(initialConversationId ?? conversations[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const active = conversations.find((c) => c.id === activeId);
  const messages = MOCK_MESSAGES[activeId] ?? [];

  const filtered = conversations.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.participantName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[480px] overflow-hidden rounded-[16px] border border-ecopet-gray/10 bg-white dark:bg-white/[0.02]">
      {/* Lista de conversas */}
      <aside className="flex w-full flex-col border-r border-ecopet-gray/10 sm:w-80 lg:w-96">
        <div className="border-b border-ecopet-gray/10 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecopet-gray" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conversas..." className="pl-9" />
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto">
            {["Todas", "Abertas", "Orçamento", "Suporte"].map((f) => (
              <button key={f} type="button" className="shrink-0 rounded-full bg-ecopet-gray/10 px-2.5 py-1 text-[10px] font-semibold hover:bg-ecopet-green/10">
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <ConversationRow key={c.id} conversation={c} active={c.id === activeId} onClick={() => setActiveId(c.id)} />
          ))}
        </div>
      </aside>

      {/* Thread */}
      <div className="hidden flex-1 flex-col sm:flex">
        {active ? (
          <>
            <header className="flex items-center justify-between border-b border-ecopet-gray/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image src={active.participantAvatar} alt="" fill className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold">{active.participantName}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[active.type] ?? active.type}</Badge>
                    {active.tags?.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost"><Tag className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost"><Filter className="h-4 w-4" /></Button>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>

            <footer className="border-t border-ecopet-gray/10 p-3">
              <div className="mb-2 flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs"><Sparkles className="h-3 w-3" /> Resposta rápida</Button>
                {role === "partner" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <Link href={`/marketplace/orcamentos?new=1&chat=${activeId}`}><FileText className="h-3 w-3" /> Enviar orçamento</Link>
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost"><Paperclip className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost"><ImageIcon className="h-4 w-4" /></Button>
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && setMessage("")} />
                <Button size="icon"><Send className="h-4 w-4" /></Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-ecopet-gray">
            <MessageCircle className="mb-2 h-12 w-12 opacity-30" />
            <p>Selecione uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationRow({ conversation, active, onClick }: { conversation: ChatConversation; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full items-start gap-3 border-b border-ecopet-gray/5 px-3 py-3 text-left transition-colors hover:bg-ecopet-green/5", active && "bg-ecopet-green/10")}>
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
        <Image src={conversation.participantAvatar} alt="" fill className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{conversation.title}</p>
          <span className="shrink-0 text-[10px] text-ecopet-gray">{conversation.lastMessageAt}</span>
        </div>
        <p className="truncate text-xs text-ecopet-gray">{conversation.lastMessage}</p>
        <div className="mt-1 flex items-center gap-1">
          <Badge variant="outline" className="text-[9px]">{TYPE_LABELS[conversation.type]}</Badge>
          {conversation.unread > 0 && <Badge className="text-[9px]">{conversation.unread}</Badge>}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isOwn = message.senderRole === "client";
  const isAI = message.senderRole === "ai" || message.senderRole === "system";

  if (message.type === "quote" && message.quote) {
    return (
      <div className={cn("max-w-[85%]", isOwn ? "ml-auto" : "")}>
        <p className="mb-1 text-xs text-ecopet-gray">{message.senderName}</p>
        <CustomQuoteCard quote={message.quote} compact />
      </div>
    );
  }

  return (
    <div className={cn("flex max-w-[75%] flex-col", isOwn ? "ml-auto items-end" : "items-start")}>
      <p className="mb-0.5 text-[10px] text-ecopet-gray">{message.senderName}</p>
      <div className={cn(
        "rounded-2xl px-3 py-2 text-sm",
        isAI ? "bg-ecopet-yellow/15 border border-ecopet-yellow/30" :
        isOwn ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10"
      )}>
        {message.content}
      </div>
      <span className="mt-0.5 text-[10px] text-ecopet-gray">{message.createdAt}</span>
    </div>
  );
}

export function PartnerClientChat(props: Omit<ChatHubProps, "role">) {
  return <ChatHub {...props} role="partner" />;
}

export function ClientSystemChat(props: Omit<ChatHubProps, "role">) {
  return <ChatHub {...props} role="client" />;
}

export function PartnerSystemChat(props: Omit<ChatHubProps, "role">) {
  return <ChatHub {...props} role="system" />;
}

export function NGOSystemChat(props: Omit<ChatHubProps, "role">) {
  return <ChatHub {...props} role="ngo" />;
}

export function NGOExternalChat(props: Omit<ChatHubProps, "role">) {
  return <ChatHub {...props} role="ngo" />;
}

/** Alias para fluxo de serviço personalizado via chat */
export function CustomServiceChat(props: Omit<ChatHubProps, "role">) {
  return <ChatHub {...props} role="client" />;
}
