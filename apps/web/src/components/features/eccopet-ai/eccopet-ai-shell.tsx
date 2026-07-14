"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ApiRequestError, parseApiFailureError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import type { EccoPetTool } from "@/lib/public/eccopet-tools";
import {
  AiUnavailableBanner,
  isAiNotConfiguredErrorCode,
} from "@/components/features/ai/ai-unavailable-banner";
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

function mapApiMessages(
  rows: Array<{ id: string; role: string; content: string }>
): AIMessage[] {
  return rows
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

function isQuotaOrRateLimit(code?: string): boolean {
  if (!code) return false;
  return (
    code.includes("RATE") ||
    code.includes("QUOTA") ||
    code.includes("BUDGET") ||
    code === "AI_RATE_LIMIT" ||
    code === "AI_BUDGET_EXCEEDED"
  );
}

function isTimeoutCode(code?: string): boolean {
  return Boolean(code && (code.includes("TIMEOUT") || code === "AI_TIMEOUT"));
}

type MobileView = "history" | "chat" | "context";

type ChatApiJson = {
  success?: boolean;
  data?: {
    reply?: string;
    content?: string;
    conversationId?: string;
    messageId?: string;
  };
  reply?: string;
  content?: string;
  conversationId?: string;
  error?: { code?: string; message?: string };
};

export function EccoPetAIShell() {
  const { isAuthenticated } = useAuthGate();
  const { t, locale } = useTranslation();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoCount, setDemoCount] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("chat");
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [aiUnavailableMessage, setAiUnavailableMessage] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );
  const messages = active?.messages ?? [];

  const updateConversation = useCallback((id: string, updater: (c: AIConversation) => AIConversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api<{
        success?: boolean;
        data?: {
          conversations?: Array<{
            id: string;
            title: string | null;
            createdAt: string;
            updatedAt?: string;
          }>;
        };
      }>("/api/ai/conversations");
      const list = res.data?.conversations ?? [];
      setConversations((prev) => {
        const prevById = new Map(prev.map((c) => [c.id, c]));
        return list.map((c) => {
          const existing = prevById.get(c.id);
          return {
            id: c.id,
            title: c.title?.trim() || t("ecopetAi.sidebar.newConversation"),
            messages: existing?.messages ?? [],
            createdAt: new Date(c.createdAt).getTime(),
          };
        });
      });
    } catch {
      // Keep local state if list fails
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const ensureConversationId = useCallback(
    async (seedTitle: string): Promise<string> => {
      if (activeId) return activeId;
      if (!isAuthenticated) {
        const localId = uid();
        const title = seedTitle.length > 40 ? `${seedTitle.slice(0, 40)}…` : seedTitle;
        setConversations((prev) => [
          { id: localId, title, messages: [], createdAt: Date.now() },
          ...prev,
        ]);
        setActiveId(localId);
        return localId;
      }

      const res = await api<{
        success?: boolean;
        data?: { conversation?: { id: string; title?: string | null; createdAt?: string } };
      }>("/api/ai/conversations", {
        method: "POST",
        body: JSON.stringify({
          title: seedTitle.slice(0, 80),
          locale,
        }),
      });
      const created = res.data?.conversation;
      if (!created?.id) throw new Error(t("ecopetAi.errors.generic"));
      const title =
        created.title?.trim() ||
        (seedTitle.length > 40 ? `${seedTitle.slice(0, 40)}…` : seedTitle);
      setConversations((prev) => [
        {
          id: created.id,
          title,
          messages: [],
          createdAt: created.createdAt ? new Date(created.createdAt).getTime() : Date.now(),
        },
        ...prev,
      ]);
      setActiveId(created.id);
      return created.id;
    },
    [activeId, isAuthenticated, locale, t]
  );

  const applyChatError = useCallback(
    (
      code: string | undefined,
      message: string | undefined,
      convId: string,
      pendingId: string,
      userMsgId?: string
    ) => {
      if (isAiNotConfiguredErrorCode(code)) {
        setAiUnavailable(true);
        setAiUnavailableMessage(message || t("empty.ai.unavailable"));
        setChatError(null);
        updateConversation(convId, (c) => ({
          ...c,
          messages: c.messages.filter(
            (m) => m.id !== pendingId && (userMsgId ? m.id !== userMsgId : true)
          ),
        }));
        return;
      }
      let friendly = message || t("ecopetAi.errors.generic");
      if (isQuotaOrRateLimit(code)) {
        friendly = t("ecopetAi.errors.quota");
      } else if (isTimeoutCode(code)) {
        friendly = t("ecopetAi.errors.timeout");
      }
      setChatError(friendly);
      updateConversation(convId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === pendingId ? { id: m.id, role: "assistant", content: friendly } : m
        ),
      }));
    },
    [t, updateConversation]
  );

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || loading || aiUnavailable) return;

      if (!isAuthenticated && demoCount >= DEMO_LIMIT) {
        setGateOpen(true);
        return;
      }

      setChatError(null);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      let convId: string;
      try {
        convId = await ensureConversationId(clean);
      } catch (err) {
        setChatError(err instanceof Error ? err.message : t("ecopetAi.errors.generic"));
        return;
      }

      const userMsg: AIMessage = { id: uid(), role: "user", content: clean };
      const pendingId = uid();
      updateConversation(convId, (c) => ({
        ...c,
        title: c.messages.length === 0 ? (clean.length > 40 ? `${clean.slice(0, 40)}…` : clean) : c.title,
        messages: [...c.messages, userMsg, { id: pendingId, role: "assistant", content: "", pending: true }],
      }));
      setLoading(true);
      if (!isAuthenticated) setDemoCount((n) => n + 1);

      try {
        if (!isAuthenticated) {
          // Guest demo: local reply only — never call OpenAI / authenticated AI routes
          const reply = t("ecopetAi.demoReply");
          updateConversation(convId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === pendingId
                ? {
                    id: m.id,
                    role: "assistant",
                    content: reply,
                    recommendations: deriveRecommendations(`${clean} ${reply}`, t),
                  }
                : m
            ),
          }));
          return;
        }

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message: clean,
            type: "general",
            locale,
            conversationId: convId,
            module: "eccopet-ai",
          }),
        });
        const json = (await res.json().catch(() => ({}))) as ChatApiJson;
        const code = json.error?.code;

        if (!res.ok || json.success === false) {
          applyChatError(code, json.error?.message, convId, pendingId, userMsg.id);
          return;
        }

        const reply =
          (json.data?.content ?? json.data?.reply ?? json.content ?? json.reply)?.trim() ?? "";
        if (!reply) {
          applyChatError("AI_UNAVAILABLE", t("empty.ai.unavailable"), convId, pendingId);
          return;
        }

        const serverMessageId = json.data?.messageId;
        updateConversation(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === pendingId
              ? {
                  id: serverMessageId || m.id,
                  role: "assistant",
                  content: reply,
                  recommendations: deriveRecommendations(`${clean} ${reply}`, t),
                }
              : m
          ),
        }));
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          updateConversation(convId, (c) => ({
            ...c,
            messages: c.messages.filter((m) => m.id !== pendingId),
          }));
          return;
        }
        const code = err instanceof ApiRequestError ? err.code : undefined;
        const msg =
          err instanceof Error ? err.message : t("ecopetAi.errors.generic");
        applyChatError(code, msg, convId, pendingId, userMsg.id);
      } finally {
        setLoading(false);
      }
    },
    [
      aiUnavailable,
      applyChatError,
      demoCount,
      ensureConversationId,
      isAuthenticated,
      loading,
      locale,
      t,
      updateConversation,
    ]
  );

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (!activeId || loading || aiUnavailable || !isAuthenticated) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    const lastUser = [...conv.messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    setChatError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const pendingId = uid();
    updateConversation(activeId, (c) => {
      const withoutLastAssistant = [...c.messages];
      for (let i = withoutLastAssistant.length - 1; i >= 0; i--) {
        if (withoutLastAssistant[i].role === "assistant") {
          withoutLastAssistant.splice(i, 1);
          break;
        }
      }
      return {
        ...c,
        messages: [
          ...withoutLastAssistant,
          { id: pendingId, role: "assistant", content: "", pending: true },
        ],
      };
    });
    setLoading(true);

    try {
      const res = await fetch(`/api/ai/conversations/${activeId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: lastUser.content,
          locale,
          regenerate: true,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as ChatApiJson;
      const code = json.error?.code;

      if (!res.ok || json.success === false) {
        applyChatError(code, json.error?.message, activeId, pendingId);
        return;
      }

      const reply =
        (json.data?.content ?? json.data?.reply ?? json.content ?? json.reply)?.trim() ?? "";
      if (!reply) {
        applyChatError("AI_UNAVAILABLE", t("empty.ai.unavailable"), activeId, pendingId);
        return;
      }

      const serverMessageId = json.data?.messageId;
      updateConversation(activeId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === pendingId
            ? {
                id: serverMessageId || m.id,
                role: "assistant",
                content: reply,
                recommendations: deriveRecommendations(`${lastUser.content} ${reply}`, t),
              }
            : m
        ),
      }));
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        updateConversation(activeId, (c) => ({
          ...c,
          messages: c.messages.filter((m) => m.id !== pendingId),
        }));
        return;
      }
      const code = err instanceof ApiRequestError ? err.code : undefined;
      applyChatError(
        code,
        err instanceof Error ? err.message : t("ecopetAi.errors.generic"),
        activeId,
        pendingId
      );
    } finally {
      setLoading(false);
    }
  }, [
    activeId,
    aiUnavailable,
    applyChatError,
    conversations,
    isAuthenticated,
    loading,
    locale,
    t,
    updateConversation,
  ]);

  const handleSelect = useCallback(
    async (id: string) => {
      setActiveId(id);
      setMobileView("chat");
      setChatError(null);
      if (!isAuthenticated) return;

      try {
        const res = await api<{
          success?: boolean;
          data?: {
            conversation?: {
              id: string;
              title?: string | null;
              createdAt?: string;
              messages?: Array<{ id: string; role: string; content: string }>;
            };
          };
        }>(`/api/ai/conversations/${id}`);
        const conversation = res.data?.conversation;
        if (!conversation) return;
        updateConversation(id, (c) => ({
          ...c,
          title: conversation.title?.trim() || c.title,
          messages: mapApiMessages(conversation.messages ?? []),
          createdAt: conversation.createdAt
            ? new Date(conversation.createdAt).getTime()
            : c.createdAt,
        }));
      } catch {
        // Keep existing local messages if load fails
      }
    },
    [isAuthenticated, updateConversation]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) setActiveId(null);
        return;
      }
      try {
        await api(`/api/ai/conversations/${id}`, { method: "DELETE" });
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) setActiveId(null);
      } catch (err) {
        const parsed =
          err instanceof ApiRequestError
            ? { code: err.code, message: err.message }
            : parseApiFailureError({});
        setChatError(parsed.message || t("ecopetAi.errors.generic"));
      }
    },
    [activeId, isAuthenticated, t]
  );

  const handleNew = useCallback(() => {
    setActiveId(null);
    setChatError(null);
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
              void handleSelect(id);
            }}
            onDelete={(id) => {
              void handleDelete(id);
            }}
            onSelectPreset={handleSelectPreset}
            className="w-full"
          />
        </div>

        {/* CENTER — chat */}
        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/50 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/30",
            mobileView !== "chat" && "hidden lg:flex"
          )}
        >
          {aiUnavailable && (
            <div className="border-b border-zinc-200/60 p-3 dark:border-white/10">
              <AiUnavailableBanner message={aiUnavailableMessage ?? undefined} />
            </div>
          )}
          {chatError && !aiUnavailable ? (
            <div
              className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
              role="alert"
            >
              {chatError}
            </div>
          ) : null}
          <div className="min-h-0 flex-1">
            <AIChatWindow
              messages={messages}
              loading={loading}
              conversationId={activeId}
              onSend={aiUnavailable ? () => undefined : send}
              onCancel={handleCancel}
              onRegenerate={
                aiUnavailable || !isAuthenticated ? undefined : () => void handleRegenerate()
              }
              onSelectTool={aiUnavailable ? () => undefined : handleSelectTool}
              onAttachAttempt={handleAttach}
            />
          </div>
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
