"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MessageCircle, Send } from "lucide-react";
import { AppHeader } from "@/components/layouts/app-header";
import { SocialSubNav } from "@/components/features/social/social-sub-nav";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocialStore } from "@/store/social-store";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { formatSocialTime } from "@/lib/social/config";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useTranslation } from "@/providers/i18n-provider";

export function MessagesPageContent() {
  const { t } = useTranslation();
  const { user } = useFoundationSession();
  const conversations = useSocialStore((s) => s.conversations);
  const messages = useSocialStore((s) => s.messages);
  const activeId = useSocialStore((s) => s.activeConversationId);
  const loadConversations = useSocialStore((s) => s.loadConversations);
  const loadMessages = useSocialStore((s) => s.loadMessages);
  const setActiveConversation = useSocialStore((s) => s.setActiveConversation);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) loadConversations(undefined, user.id);
  }, [loadConversations, user]);

  useEffect(() => {
    if (activeId && user) loadMessages(activeId, undefined, user.id);
  }, [activeId, loadMessages, user]);

  const activeConv = conversations.find((c) => c.id === activeId);

  async function handleSend() {
    if (!draft.trim() || !activeId || sending || !user) return;
    setSending(true);
    try {
      await api(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: draft.trim() }),
      });
      setDraft("");
      await loadMessages(activeId, undefined, user.id);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <AppHeader title={t("nav.messages")} />
      <SocialSubNav />
      <main className="mx-auto flex max-w-4xl flex-1 flex-col lg:h-[calc(100vh-8rem)] lg:flex-row lg:overflow-hidden lg:p-4 lg:gap-4">
        <div className={cn("flex flex-col border-ecopet-gray/10 lg:w-80 lg:rounded-2xl lg:border lg:bg-white lg:dark:bg-[#0f1419]", activeId && "hidden lg:flex")}>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={MessageCircle}
                  title={t("empty.messages.title")}
                  description={t("empty.messages.description")}
                />
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveConversation(conv.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-ecopet-gray/5 px-4 py-3 text-left transition hover:bg-ecopet-green/5",
                    activeId === conv.id && "bg-ecopet-green/10"
                  )}
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image src={conv.participant.avatar} alt="" width={48} height={48} className="object-cover" />
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
              ))
            )}
          </div>
        </div>

        <div className={cn("flex flex-1 flex-col lg:rounded-2xl lg:border lg:bg-white lg:dark:bg-[#0f1419]", !activeId && "hidden lg:flex")}>
          {activeConv ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.isMine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", m.isMine ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}>
                      {m.content}
                      <p className="mt-1 text-[10px] opacity-70">{formatSocialTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t p-3">
                <Input
                  placeholder={t("empty.messages.placeholder")}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button type="button" size="icon" disabled={sending || !draft.trim()} onClick={handleSend} aria-label={t("empty.messages.send")}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Card className="m-4 border-dashed">
              <CardContent className="p-8 text-center text-sm text-ecopet-gray">
                {t("empty.messages.selectConversation")}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
