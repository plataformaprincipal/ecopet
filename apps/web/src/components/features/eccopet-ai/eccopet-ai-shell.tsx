"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, MessageSquare, PanelRight, Bookmark, Lock } from "lucide-react";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { LanguageSelector } from "@/components/features/i18n/language-selector";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import type { TranslateFn } from "@/lib/i18n";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { EccoPetTool } from "@/lib/public/eccopet-tools";
import { AIConversationSidebar, type AIPreset } from "./ai-conversation-sidebar";
import { AIChatWindow } from "./ai-chat-window";
import { AIContextPanel } from "./ai-context-panel";
import type { AIConversation, AIMessage, AIRecommendation } from "./types";

const DEMO_LIMIT = 4;

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveRecommendations(text: string, t: TranslateFn): AIRecommendation[] {
  const s = text.toLowerCase();
  const recs: AIRecommendation[] = [];
  if (/(produto|ração|racao|petisco|acess[óo]rio|marketplace|comprar|product|aliment)/.test(s)) {
    recs.push({ label: t("ecopetAi.rec.products"), href: "/marketplace" });
  }
  if (/(servi[çc]o|banho|tosa|veterin|consulta|agendar|service|grooming|vet)/.test(s)) {
    recs.push({ label: t("ecopetAi.rec.services"), href: "/marketplace?tab=services" });
  }
  if (/(ado[çc]|adotar|adopt)/.test(s)) {
    recs.push({ label: t("ecopetAi.rec.adoptions"), href: "/adocao" });
  }
  return recs.slice(0, 2);
}

type MobileView = "history" | "chat" | "context";

export function EccoPetAIShell() {
  const { isAuthenticated } = useAuthGate();
  const { t } = useTranslation();
  const DEMO_REPLY = t("ecopetAi.demoReply");
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoCount, setDemoCount] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("chat");

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);
  const messages = active?.messages ?? [];

  const updateConversation = useCallback((id: string, updater: (c: AIConversation) => AIConversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || loading) return;

      if (!isAuthenticated && demoCount >= DEMO_LIMIT) {
        setGateOpen(true);
        return;
      }

      // Ensure an active conversation exists.
      let convId = activeId;
      if (!convId) {
        convId = uid();
        const title = clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
        setConversations((prev) => [{ id: convId!, title, messages: [], createdAt: Date.now() }, ...prev]);
        setActiveId(convId);
      }

      const userMsg: AIMessage = { id: uid(), role: "user", content: clean };
      const pendingId = uid();
      updateConversation(convId, (c) => ({
        ...c,
        messages: [...c.messages, userMsg, { id: pendingId, role: "assistant", content: "", pending: true }],
      }));
      setLoading(true);
      if (!isAuthenticated) setDemoCount((n) => n + 1);

      try {
        const res = await api<{ success?: boolean; data?: { reply?: string; content?: string }; reply?: string; content?: string }>(
          "/api/ai/chat",
          {
            method: "POST",
            body: JSON.stringify({ message: clean, type: "general" }),
          }
        );
        const reply =
          (res.data?.content ?? res.data?.reply ?? res.content ?? res.reply)?.trim() || DEMO_REPLY;
        updateConversation(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === pendingId
              ? { id: m.id, role: "assistant", content: reply, recommendations: deriveRecommendations(`${clean} ${reply}`, t) }
              : m
          ),
        }));
      } catch {
        updateConversation(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === pendingId
              ? { id: m.id, role: "assistant", content: DEMO_REPLY, recommendations: deriveRecommendations(clean, t) }
              : m
          ),
        }));
      } finally {
        setLoading(false);
      }
    },
    [activeId, demoCount, isAuthenticated, loading, updateConversation, DEMO_REPLY, t]
  );

  const handleNew = useCallback(() => {
    setActiveId(null);
    setMobileView("chat");
  }, []);

  const handleSelectPreset = useCallback(
    (preset: AIPreset) => {
      setMobileView("chat");
      void send(preset.prompt);
    },
    [send]
  );

  const handleSelectTool = useCallback(
    (tool: EccoPetTool) => {
      if (tool.status === "coming_soon") return;
      void send(tool.demoPrompt ?? t(`ecopetAi.tools.${tool.id}.title`));
    },
    [send, t]
  );

  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      setGateOpen(true);
    }
  }, [isAuthenticated]);

  const handleAttach = useCallback(() => {
    if (!isAuthenticated) setGateOpen(true);
  }, [isAuthenticated]);

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[1500px] flex-col px-3 pb-24 pt-3 sm:px-4 lg:px-6 lg:pb-4">
      {/* Top bar */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <EcoPetLogo href="/eccopet" size="sm" showText />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="hidden items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 sm:flex dark:border-white/10 dark:bg-zinc-900"
          >
            <Bookmark className="h-3.5 w-3.5" aria-hidden />
            {t("ecopetAi.topbar.save")}
          </button>
          {!isAuthenticated ? (
            <>
              <Link href="/login" className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-ecopet-green sm:inline-block dark:text-zinc-300">
                {t("ecopetAi.topbar.signIn")}
              </Link>
              <Link href="/cadastro" className="rounded-full bg-ecopet-green px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                {t("ecopetAi.topbar.createAccount")}
              </Link>
            </>
          ) : null}
          <LanguageSelector compact className="shrink-0" />
        </div>
      </div>

      {/* Mobile view switcher */}
      <div className="mb-3 flex gap-1 rounded-2xl border border-zinc-200/80 bg-white p-1 shadow-sm lg:hidden dark:border-white/10 dark:bg-zinc-900/60">
        {([
          { id: "history", label: t("ecopetAi.mobile.conversations"), icon: MessageSquare },
          { id: "chat", label: t("ecopetAi.mobile.chat"), icon: Sparkles },
          { id: "context", label: t("ecopetAi.mobile.context"), icon: PanelRight },
        ] as const).map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setMobileView(v.id)}
            aria-current={mobileView === v.id ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition",
              mobileView === v.id ? "bg-ecopet-green text-white" : "text-zinc-500"
            )}
          >
            <v.icon className="h-4 w-4" aria-hidden />
            {v.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_300px] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        {/* LEFT — conversations */}
        <div className={cn("min-h-0", mobileView !== "history" && "hidden lg:flex")}>
          <AIConversationSidebar
            conversations={conversations}
            activeId={activeId}
            onNew={handleNew}
            onSelect={(id) => {
              setActiveId(id);
              setMobileView("chat");
            }}
            onSelectPreset={handleSelectPreset}
            className="w-full"
          />
        </div>

        {/* CENTER — chat */}
        <div
          className={cn(
            "min-h-0 overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/50 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/30",
            mobileView !== "chat" && "hidden lg:block"
          )}
        >
          <AIChatWindow
            messages={messages}
            loading={loading}
            onSend={send}
            onSelectTool={handleSelectTool}
            onAttachAttempt={handleAttach}
          />
        </div>

        {/* RIGHT — context */}
        <div className={cn("min-h-0 overflow-y-auto", mobileView !== "context" && "hidden lg:block")}>
          <AIContextPanel />
        </div>
      </div>

      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent aria-describedby="eccopet-gate-desc">
          <DialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-ecopet-green/10">
              <Lock className="h-6 w-6 text-ecopet-green" aria-hidden />
            </div>
            <DialogTitle>{t("ecopetAi.gate.title")}</DialogTitle>
            <DialogDescription id="eccopet-gate-desc">
              {t("ecopetAi.gate.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/login">{t("ecopetAi.gate.signIn")}</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/cadastro">{t("ecopetAi.gate.createAccount")}</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
