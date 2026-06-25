"use client";

import { useState } from "react";
import { LayoutGrid, Sparkles, Bell, MessageSquare, Plus, Filter } from "lucide-react";
import { SocialSidebar } from "@/components/features/social/ecopet-social/social-sidebar";
import { SocialFeedStream } from "@/components/features/social/ecopet-social/social-feed-stream";
import { SuggestedProfilesPanel } from "@/components/features/social/ecopet-social/suggested-profiles-panel";
import { SOCIAL_FILTERS, type SocialFilterId } from "@/components/features/social/ecopet-social/filters";
import { HubAssistantPanel } from "./hub-assistant-panel";
import { HubNotificationsPanel } from "./hub-notifications-panel";
import { HubMessagesPanel } from "./hub-messages-panel";
import { HubTrending } from "./hub-trending";
import { HubChatDrawer } from "./hub-chat-drawer";
import type { ConversationItem } from "@/lib/messages/client-api";
import { cn } from "@/lib/utils";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { LanguageSelector } from "@/components/features/i18n/language-selector";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";

type MobileTab = "feed" | "ai" | "notifications" | "messages";

const MOBILE_TABS: { id: MobileTab; labelKey: string; icon: typeof LayoutGrid }[] = [
  { id: "feed", labelKey: "social.tabs.feed", icon: LayoutGrid },
  { id: "ai", labelKey: "social.tabs.ai", icon: Sparkles },
  { id: "notifications", labelKey: "social.tabs.alerts", icon: Bell },
  { id: "messages", labelKey: "social.tabs.chat", icon: MessageSquare },
];

function GuestPanelCTA({ title, description, signIn }: { title: string; description: string; signIn: string }) {
  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white/70 p-4 text-center shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50">
      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
      <a href="/login" className="mt-3 inline-block rounded-xl bg-ecopet-green px-4 py-2 text-xs font-semibold text-white">
        {signIn}
      </a>
    </section>
  );
}

export function SocialHub() {
  const { requireAuth, isAuthenticated } = useAuthGate();
  const { t } = useTranslation();
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("feed");
  const [activeFilter, setActiveFilter] = useState<SocialFilterId>("my-feed");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  function handleSelectFilter(id: SocialFilterId) {
    setActiveFilter(id);
    setMobileTab("feed");
    setMobileFiltersOpen(false);
  }

  return (
    <div className="relative mx-auto w-full max-w-[1500px] px-3 pb-28 pt-4 sm:px-4 lg:px-6 lg:pb-8">
      {/* Top bar — logo + language selector (top right, all breakpoints) */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <EcoPetLogo href="/social" size="sm" showText />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 lg:hidden dark:border-white/10 dark:bg-zinc-900"
            aria-expanded={mobileFiltersOpen}
          >
            <Filter className="h-3.5 w-3.5" aria-hidden />
            {t("social.topbar.filters")}
          </button>
          {!isAuthenticated ? (
            <>
              <a
                href="/login"
                className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-ecopet-green sm:inline-block dark:text-zinc-300"
              >
                {t("social.topbar.signIn")}
              </a>
              <a
                href="/cadastro"
                className="rounded-full bg-ecopet-green px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                {t("social.topbar.createAccount")}
              </a>
            </>
          ) : null}
          <LanguageSelector compact className="shrink-0" />
        </div>
      </div>

      {/* Mobile filter chips (collapsible) */}
      {mobileFiltersOpen ? (
        <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
          {SOCIAL_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleSelectFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                activeFilter === f.id
                  ? "bg-ecopet-green text-white"
                  : "border border-zinc-200/80 bg-white text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      ) : null}

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
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px] xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        {/* LEFT — navigation (desktop) */}
        <SocialSidebar active={activeFilter} onSelect={handleSelectFilter} className="hidden lg:block" />

        {/* CENTER — feed */}
        <div className={cn("min-w-0", mobileTab !== "feed" && "hidden lg:block")}>
          <SocialFeedStream activeFilter={activeFilter} />
        </div>

        {/* RIGHT — assistant + notifications + messages + trending + suggestions */}
        <div className="space-y-4">
          <div className={cn(mobileTab !== "ai" && "hidden lg:block")}>
            <HubAssistantPanel />
          </div>
          <div className={cn(mobileTab !== "notifications" && "hidden lg:block")}>
            {isAuthenticated ? (
              <HubNotificationsPanel />
            ) : (
              <GuestPanelCTA
                title={t("social.panels.notificationsGuestTitle")}
                description={t("social.panels.notificationsGuestDesc")}
                signIn={t("social.panels.guestSignIn")}
              />
            )}
          </div>
          <div className={cn(mobileTab !== "messages" && "hidden lg:block")}>
            {isAuthenticated ? (
              <HubMessagesPanel onOpenConversation={setActiveChat} />
            ) : (
              <GuestPanelCTA
                title={t("social.panels.messagesGuestTitle")}
                description={t("social.panels.messagesGuestDesc")}
                signIn={t("social.panels.guestSignIn")}
              />
            )}
          </div>
          <div className={cn(mobileTab !== "feed" && "hidden lg:block")}>
            <HubTrending />
          </div>
          <div className={cn(mobileTab !== "feed" && "hidden lg:block")}>
            <SuggestedProfilesPanel />
          </div>
        </div>
      </div>

      {/* Mobile floating actions */}
      <div className="fixed bottom-24 right-4 z-30 flex flex-col gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("ai")}
          aria-label={t("social.fab.assistant")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ecopet-green shadow-lg ring-1 ring-ecopet-green/20 transition active:scale-95 dark:bg-zinc-900"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => requireAuth(() => setMobileTab("feed"))}
          aria-label={t("social.fab.newPost")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-ecopet-green text-white shadow-xl shadow-ecopet-green/30 transition active:scale-95"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </button>
      </div>

      <HubChatDrawer conversation={activeChat} onClose={() => setActiveChat(null)} />
    </div>
  );
}
