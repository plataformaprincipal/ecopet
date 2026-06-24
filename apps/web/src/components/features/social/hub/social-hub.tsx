"use client";

import { useState } from "react";
import { LayoutGrid, Sparkles, Bell, MessageSquare } from "lucide-react";
import { HubLeftSidebar } from "./hub-left-sidebar";
import { HubFeed } from "./hub-feed";
import { HubAssistantPanel } from "./hub-assistant-panel";
import { HubNotificationsPanel } from "./hub-notifications-panel";
import { HubMessagesPanel } from "./hub-messages-panel";
import { HubTrending } from "./hub-trending";
import { HubChatDrawer } from "./hub-chat-drawer";
import type { ConversationItem } from "@/lib/messages/client-api";
import { cn } from "@/lib/utils";

type MobileTab = "feed" | "ai" | "notifications" | "messages";

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "feed", label: "Feed", icon: LayoutGrid },
  { id: "ai", label: "IA", icon: Sparkles },
  { id: "notifications", label: "Alertas", icon: Bell },
  { id: "messages", label: "Chat", icon: MessageSquare },
];

export function SocialHub() {
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("feed");

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 pb-24 pt-4 sm:px-4 lg:px-6 lg:pb-8">
      {/* Mobile tab switcher */}
      <div className="mb-4 flex gap-1 rounded-2xl border border-zinc-200/80 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 lg:hidden">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            aria-current={mobileTab === tab.id ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition",
              mobileTab === tab.id ? "bg-ecopet-green text-white" : "text-zinc-500"
            )}
          >
            <tab.icon className="h-4 w-4" aria-hidden />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_300px] xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        {/* LEFT — navigation (desktop) */}
        <HubLeftSidebar className="hidden lg:block" />

        {/* CENTER — feed */}
        <div className={cn("min-w-0", mobileTab !== "feed" && "hidden lg:block")}>
          <HubFeed />
        </div>

        {/* RIGHT — assistant + notifications + messages + trending */}
        <div className="space-y-4">
          <div className={cn(mobileTab !== "ai" && "hidden lg:block")}>
            <HubAssistantPanel />
          </div>
          <div className={cn(mobileTab !== "notifications" && "hidden lg:block")}>
            <HubNotificationsPanel />
          </div>
          <div className={cn(mobileTab !== "messages" && "hidden lg:block")}>
            <HubMessagesPanel onOpenConversation={setActiveChat} />
          </div>
          <div className={cn(mobileTab !== "feed" && "hidden lg:block")}>
            <HubTrending />
          </div>
        </div>
      </div>

      <HubChatDrawer conversation={activeChat} onClose={() => setActiveChat(null)} />
    </div>
  );
}
