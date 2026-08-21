"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, MessageSquare, PanelRight, Lock } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAiRuntimeStatus } from "@/hooks/use-ai-runtime-status";
import { useActivePetForAi } from "@/hooks/use-active-pet-for-ai";
import { getPetAIContext } from "@/lib/ai/pet-context";
import {
  getCapability,
  getQuickPrompts,
  resolveCapabilitiesForUser,
  statusPhaseLabelKey,
  type ResolvedCapability,
} from "@/lib/ai/capabilities/registry";
import { isWorkspaceCapability, normalizeCapabilityId } from "@/lib/ai/capabilities/orchestrate";
import { readStoredAiGeo } from "@/lib/ai/client-geo";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useTranslation } from "@/providers/i18n-provider";
import type { TranslateFn } from "@/lib/i18n";
import { localApi } from "@/lib/local-api.client";
import { ApiRequestError, parseApiFailureError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import {
  AiUnavailableBanner,
  isAiNotConfiguredErrorCode,
} from "@/components/features/ai/ai-unavailable-banner";
import { useAiClientActions } from "@/hooks/use-ai-client-actions";
import { geoPayloadForRequest } from "@/lib/ai/client-geo";
import { AIConversationSidebar, type AIPreset } from "./ai-conversation-sidebar";
import { AIChatWindow } from "./ai-chat-window";
import { AIContextPanel } from "./ai-context-panel";
import { AIWorkspaceHeader } from "./ai-workspace-header";
import type { AIConfirmation, AIConversation, AIMessage, AIRecommendation, AIStructuredBlock } from "./types";

const GUEST_MESSAGE_LIMIT = 12;

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

type StreamEvent = {
  type?: string;
  text?: string;
  content?: string;
  code?: string;
  message?: string;
  messageId?: string;
  conversationId?: string;
  phase?: string;
  tools?: string[];
  action?: string;
  payload?: Record<string, unknown>;
  toolName?: string;
  preview?: unknown;
  params?: Record<string, unknown>;
  kind?: string;
  items?: unknown[];
  url?: string;
  prompt?: string;
};

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
  const { data: session } = useAuthSession();
  const { user, token } = useCurrentUser();
  const { t, locale } = useTranslation();
  const { status: runtimeStatus, loading: runtimeLoading } = useAiRuntimeStatus();
  const searchParams = useSearchParams();
  const { apply: applyClientAction } = useAiClientActions();
  const promptConsumedRef = useRef(false);

  const isPartner = session?.user?.role === "PARTNER";
  const petIds = useMemo(() => (user?.pets ?? []).map((p) => p.id), [user?.pets]);
  const { activePetId, setActivePetId } = useActivePetForAi(petIds);
  const petContext = useMemo(
    () =>
      getPetAIContext({
        pets: (user?.pets ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
        })),
        activePetId,
      }),
    [user?.pets, activePetId]
  );

  const capabilityCtx = useMemo(
    () => ({
      isGuest: !isAuthenticated,
      isPartner,
      isOng: session?.user?.role === "ONG",
      isAdmin: session?.user?.role === "ADMIN",
      hasPet: (user?.pets?.length ?? 0) > 0,
      hasGeo: Boolean(readStoredAiGeo()),
      aiConfigured: runtimeStatus.isConfigured,
    }),
    [isAuthenticated, isPartner, session?.user?.role, user?.pets, runtimeStatus.isConfigured]
  );

  const { b2c: b2cCapabilities, b2b: b2bCapabilities } = useMemo(
    () => resolveCapabilitiesForUser(capabilityCtx),
    [capabilityCtx]
  );

  const quickPromptKeys = useMemo(
    () => getQuickPrompts({ isGuest: !isAuthenticated, isPartner }),
    [isAuthenticated, isPartner]
  );

  const [activeCapabilityId, setActiveCapabilityId] = useState<string | null>(null);
  const activeCapability = useMemo(
    () =>
      activeCapabilityId
        ? [...b2cCapabilities, ...b2bCapabilities].find((c) => c.id === activeCapabilityId) ?? null
        : null,
    [activeCapabilityId, b2cCapabilities, b2bCapabilities]
  );
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

  useEffect(() => {
    if (runtimeLoading) return;
    if (!runtimeStatus.isConfigured) {
      setAiUnavailable(true);
      setAiUnavailableMessage(t("empty.ai.unavailable"));
    }
  }, [runtimeLoading, runtimeStatus.isConfigured, t]);

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
      const res = await localApi<{
        success?: boolean;
        data?: {
          conversations?: Array<{
            id: string;
            title: string | null;
            createdAt: string;
            updatedAt?: string;
            pinned?: boolean;
            favorite?: boolean;
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
            pinned: Boolean(c.pinned),
            favorite: Boolean(c.favorite),
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

      const res = await localApi<{
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
    async (text: string, capabilityOverride?: ResolvedCapability) => {
      const clean = text.trim();
      if (!clean || loading || aiUnavailable) return;

      const cap = capabilityOverride ?? activeCapability;
      if (cap?.availability === "locked") {
        setGateOpen(true);
        return;
      }
      if (cap?.availability === "disabled") return;

      if (cap?.id) setActiveCapabilityId(cap.id);

      if (!isAuthenticated && demoCount >= GUEST_MESSAGE_LIMIT) {
        setGateOpen(true);
        return;
      }

      setChatError(null);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: AIMessage = { id: uid(), role: "user", content: clean };
      const pendingId = uid();
      const existingId = activeId;
      let convId = existingId ?? uid();
      if (!existingId) {
        const title = clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
        setConversations((prev) => [
          {
            id: convId,
            title,
            messages: [userMsg, { id: pendingId, role: "assistant", content: "", pending: true }],
            createdAt: Date.now(),
          },
          ...prev,
        ]);
        setActiveId(convId);
      } else {
        updateConversation(convId, (c) => ({
          ...c,
          title: c.messages.length === 0 ? (clean.length > 40 ? `${clean.slice(0, 40)}…` : clean) : c.title,
          messages: [...c.messages, userMsg, { id: pendingId, role: "assistant", content: "", pending: true }],
        }));
      }
      setLoading(true);
      if (!isAuthenticated) setDemoCount((n) => n + 1);

      try {
        if (isAuthenticated && !existingId) {
          const persisted = await localApi<{
            success?: boolean;
            data?: { conversation?: { id: string } };
          }>("/api/ai/conversations", {
            method: "POST",
            body: JSON.stringify({ title: clean.slice(0, 80), locale }),
          });
          const createdId = persisted.data?.conversation?.id;
          if (createdId && createdId !== convId) {
            setConversations((prev) =>
              prev.map((c) => (c.id === convId ? { ...c, id: createdId } : c))
            );
            setActiveId(createdId);
            convId = createdId;
          }
        }
      } catch (err) {
        setChatError(err instanceof Error ? err.message : t("ecopetAi.errors.generic"));
        setLoading(false);
        return;
      }

      try {
        if (!isAuthenticated) {
          const res = await fetch("/api/ai/public-chat", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              message: clean,
              locale,
              pagePath: typeof window !== "undefined" ? window.location.pathname : "/eccopet",
              capabilityId: cap?.id,
              ...geoPayloadForRequest(),
            }),
          });
          const json = (await res.json().catch(() => ({}))) as {
            success?: boolean;
            data?: {
              reply?: string;
              available?: boolean;
              requiresSignIn?: boolean;
            };
            error?: { code?: string; message?: string };
          };
          if (!res.ok || json.success === false) {
            applyChatError(json.error?.code, json.error?.message, convId, pendingId, userMsg.id);
            return;
          }
          if (json.data?.available === false) {
            setAiUnavailable(true);
            setAiUnavailableMessage(json.data.reply || t("empty.ai.unavailable"));
            updateConversation(convId, (c) => ({
              ...c,
              messages: c.messages.filter(
                (m) => m.id !== pendingId && m.id !== userMsg.id
              ),
            }));
            return;
          }
          const reply = json.data?.reply?.trim() ?? "";
          if (!reply) {
            applyChatError("AI_UNAVAILABLE", t("empty.ai.unavailable"), convId, pendingId);
            return;
          }
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
          if (json.data?.requiresSignIn) {
            setGateOpen(true);
          }
          return;
        }

        const res = await fetch("/api/ai/chat/stream", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          signal: controller.signal,
          body: JSON.stringify({
            message: clean,
            locale,
            conversationId: convId,
            pagePath: typeof window !== "undefined" ? window.location.pathname : "/eccopet",
            module: cap?.module ?? "ecopet-ai",
            capabilityId: cap?.id,
            petId: petContext?.id,
            ...geoPayloadForRequest(),
          }),
        });

        // Fallback se stream indisponível
        if (res.status === 501 || !res.ok || !res.body) {
          const fallback = await fetch("/api/ai/chat", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              message: clean,
              type: "general",
              locale,
              conversationId: convId,
              module: cap?.module ?? "ecopet-ai",
              capabilityId: cap?.id,
              petId: petContext?.id,
            }),
          });
          const json = (await fallback.json().catch(() => ({}))) as ChatApiJson;
          const code = json.error?.code;
          if (!fallback.ok || json.success === false) {
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
          const serverConv = json.data?.conversationId;
          if (serverConv && serverConv !== convId) {
            setActiveId(serverConv);
          }
          updateConversation(serverConv || convId, (c) => ({
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
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assembled = "";
        let serverMessageId: string | undefined;
        let serverConv = convId;
        let pendingConfirmation: AIConfirmation | undefined;
        const structuredBlocks: AIStructuredBlock[] = [];
        let imageUrl: string | undefined;
        let imagePrompt: string | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(line.slice(6)) as StreamEvent;
            } catch {
              continue;
            }
            if (event.type === "status" && event.phase) {
              const phaseKey = statusPhaseLabelKey(event.phase);
              updateConversation(convId, (c) => ({
                ...c,
                messages: c.messages.map((m) =>
                  m.id === pendingId
                    ? {
                        id: m.id,
                        role: "assistant",
                        content: assembled,
                        pending: true,
                        statusPhase: phaseKey,
                      }
                    : m
                ),
              }));
            } else if (event.type === "delta" && event.text) {
              assembled += event.text;
              updateConversation(convId, (c) => ({
                ...c,
                messages: c.messages.map((m) =>
                  m.id === pendingId
                    ? { id: m.id, role: "assistant", content: assembled, pending: true }
                    : m
                ),
              }));
            } else if (event.type === "client_action" && event.action) {
              applyClientAction({
                action: event.action,
                payload: event.payload ?? {},
              });
            } else if (event.type === "confirmation" && event.toolName) {
              pendingConfirmation = {
                toolName: event.toolName,
                preview: event.preview,
                message: event.message,
                params: event.params ?? {},
                status: "pending",
              };
              updateConversation(convId, (c) => ({
                ...c,
                messages: c.messages.map((m) =>
                  m.id === pendingId
                    ? {
                        ...m,
                        role: "assistant",
                        content: assembled,
                        pending: false,
                        confirmation: pendingConfirmation,
                      }
                    : m
                ),
              }));
            } else if (event.type === "structured" && event.kind && Array.isArray(event.items)) {
              structuredBlocks.push({ kind: event.kind, items: event.items });
              updateConversation(convId, (c) => ({
                ...c,
                messages: c.messages.map((m) =>
                  m.id === pendingId
                    ? {
                        ...m,
                        role: "assistant",
                        content: assembled,
                        pending: true,
                        structured: [...structuredBlocks],
                      }
                    : m
                ),
              }));
            } else if (event.type === "image" && event.url) {
              imageUrl = event.url;
              imagePrompt = event.prompt;
              updateConversation(convId, (c) => ({
                ...c,
                messages: c.messages.map((m) =>
                  m.id === pendingId
                    ? {
                        ...m,
                        role: "assistant",
                        content: assembled || "Aqui está a imagem gerada.",
                        pending: true,
                        imageUrl,
                        imagePrompt,
                      }
                    : m
                ),
              }));
            } else if (event.type === "error") {
              applyChatError(event.code, event.message, convId, pendingId, userMsg.id);
              return;
            } else if (event.type === "done") {
              assembled = event.content?.trim() || assembled;
              serverMessageId = event.messageId;
              if (event.conversationId) serverConv = event.conversationId;
            }
          }
        }

        if (!assembled.trim() && !imageUrl) {
          applyChatError("AI_UNAVAILABLE", t("empty.ai.unavailable"), convId, pendingId);
          return;
        }
        if (serverConv !== convId) setActiveId(serverConv);
        updateConversation(serverConv, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === pendingId
              ? {
                  id: serverMessageId || m.id,
                  role: "assistant",
                  content: assembled.trim() || (imageUrl ? "Aqui está a imagem gerada." : assembled),
                  recommendations: deriveRecommendations(`${clean} ${assembled}`, t),
                  confirmation: pendingConfirmation ?? m.confirmation,
                  structured: structuredBlocks.length ? structuredBlocks : m.structured,
                  imageUrl: imageUrl ?? m.imageUrl,
                  imagePrompt: imagePrompt ?? m.imagePrompt,
                }
              : m
          ),
        }));
        void loadConversations();
        return;
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
      applyClientAction,
      demoCount,
      isAuthenticated,
      loadConversations,
      loading,
      locale,
      t,
      activeCapability,
      activeId,
      petContext,
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
        const res = await localApi<{
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
        await localApi(`/api/ai/conversations/${id}`, { method: "DELETE" });
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

  const handlePatchConversation = useCallback(
    async (
      id: string,
      patch: { title?: string; pinned?: boolean; favorite?: boolean }
    ) => {
      if (!isAuthenticated) return;
      try {
        await localApi(`/api/ai/conversations/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...(patch.title ? { title: patch.title } : {}),
                  ...(typeof patch.pinned === "boolean" ? { pinned: patch.pinned } : {}),
                  ...(typeof patch.favorite === "boolean"
                    ? { favorite: patch.favorite }
                    : {}),
                }
              : c
          )
        );
      } catch {
        setChatError(t("ecopetAi.errors.generic"));
      }
    },
    [isAuthenticated, t]
  );

  const handleNew = useCallback(() => {
    setActiveId(null);
    setActiveCapabilityId(null);
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

  const handleSelectCapability = useCallback(
    (cap: ResolvedCapability, prompt: string) => {
      setMobileView("chat");
      if (cap.availability === "locked") {
        setGateOpen(true);
        return;
      }
      if (cap.availability === "disabled") return;
      setActiveCapabilityId(cap.id);
      if (isWorkspaceCapability(cap.id)) return;
      void send(prompt, cap);
    },
    [send]
  );

  const handleConfirmAction = useCallback(
    async (messageId: string) => {
      if (!activeId || !isAuthenticated) return;
      const conv = conversations.find((c) => c.id === activeId);
      const msg = conv?.messages.find((m) => m.id === messageId);
      const conf = msg?.confirmation;
      if (!conf || conf.status !== "pending") return;

      updateConversation(activeId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === messageId
            ? { ...m, confirmation: { ...conf, status: "running" as const } }
            : m
        ),
      }));

      try {
        const res = await localApi<{
          success?: boolean;
          data?: { ok?: boolean; error?: string; data?: { message?: string } };
          error?: { code?: string; message?: string };
        }>("/api/ai/tools/confirm", {
          method: "POST",
          body: JSON.stringify({
            tool: conf.toolName,
            params: conf.params,
            locale,
            idempotencyKey: `confirm:${activeId}:${messageId}:${conf.toolName}`,
          }),
        });

        const ok = res.success !== false && res.data?.ok !== false;
        const duplicate = Boolean((res.data as { duplicate?: boolean } | undefined)?.duplicate);
        const nested = res.data?.data;
        const resultMsg =
          (nested && typeof nested === "object" && "message" in nested
            ? String((nested as { message?: string }).message ?? "")
            : "") ||
          res.data?.error ||
          res.error?.message ||
          (duplicate ? t("ecopetAi.confirm.confirm") : ok ? t("ecopetAi.confirm.confirm") : t("ecopetAi.errors.generic"));

        updateConversation(activeId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  confirmation: {
                    ...conf,
                    status: ok ? ("confirmed" as const) : ("error" as const),
                    resultMessage: resultMsg,
                  },
                }
              : m
          ),
        }));
      } catch (err) {
        const msgText =
          err instanceof ApiRequestError ? err.message : t("ecopetAi.errors.generic");
        updateConversation(activeId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  confirmation: {
                    ...conf,
                    status: "error" as const,
                    resultMessage: msgText,
                  },
                }
              : m
          ),
        }));
      }
    },
    [activeId, conversations, isAuthenticated, locale, t, updateConversation]
  );

  const handleCancelAction = useCallback(
    (messageId: string) => {
      if (!activeId) return;
      updateConversation(activeId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === messageId && m.confirmation
            ? {
                ...m,
                confirmation: {
                  ...m.confirmation,
                  status: "cancelled" as const,
                  resultMessage: t("ecopetAi.confirm.cancelled"),
                },
              }
            : m
        ),
      }));
    },
    [activeId, t, updateConversation]
  );

  useEffect(() => {
    const capRaw = normalizeCapabilityId(searchParams.get("capability"));
    if (capRaw && getCapability(capRaw)) {
      setActiveCapabilityId(capRaw);
    }
    const prompt = searchParams.get("prompt")?.trim();
    if (!prompt || promptConsumedRef.current) return;
    promptConsumedRef.current = true;
    void send(prompt);
  }, [searchParams, send]);

  const handleAttach = useCallback(() => {
    if (!isAuthenticated) setGateOpen(true);
  }, [isAuthenticated]);

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[1500px] flex-col bg-[var(--ep-bg)] px-3 pb-24 pt-3 sm:px-4 lg:px-6 lg:pb-4 lg:pr-20">
      <AIWorkspaceHeader
        isAuthenticated={isAuthenticated}
        aiConfigured={runtimeStatus.isConfigured}
        activeCapability={activeCapability}
        petContext={petContext}
        pets={user?.pets ?? []}
        activePetId={activePetId}
        onPetChange={setActivePetId}
        onNewConversation={handleNew}
        onOpenHistory={() => setMobileView("history")}
        className="mb-3"
      />

      {/* Mobile view switcher */}
      <div className="mb-3 flex gap-1 rounded-[var(--radius-lg)] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-1 shadow-[var(--shadow-xs)] lg:hidden">
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
              "flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition",
              mobileView === v.id ? "bg-ecopet-green text-white" : "text-ecopet-gray"
            )}
          >
            <v.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
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
            onRename={(id, title) => {
              void handlePatchConversation(id, { title });
            }}
            onTogglePin={(id) => {
              const cur = conversations.find((c) => c.id === id);
              void handlePatchConversation(id, { pinned: !cur?.pinned });
            }}
            onToggleFavorite={(id) => {
              const cur = conversations.find((c) => c.id === id);
              void handlePatchConversation(id, { favorite: !cur?.favorite });
            }}
            onSelectPreset={handleSelectPreset}
            className="w-full"
          />
        </div>

        {/* CENTER — chat */}
        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] shadow-[var(--shadow-md)]",
            mobileView !== "chat" && "hidden lg:flex"
          )}
        >
          {aiUnavailable && (
            <div className="border-b border-ecopet-gray/10 p-3 dark:border-white/10">
              <AiUnavailableBanner message={aiUnavailableMessage ?? undefined} />
            </div>
          )}
          {chatError && !aiUnavailable ? (
            <div
              className="border-b border-ep-warning/30 bg-ep-warning/10 px-4 py-2 text-sm text-ep-warning"
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
              onSend={aiUnavailable ? () => undefined : (text) => void send(text)}
              onCancel={handleCancel}
              onRegenerate={
                aiUnavailable || !isAuthenticated ? undefined : () => void handleRegenerate()
              }
              onSelectCapability={aiUnavailable ? () => undefined : handleSelectCapability}
              onLoginRequired={() => setGateOpen(true)}
              quickPromptKeys={quickPromptKeys}
              b2cCapabilities={b2cCapabilities}
              b2bCapabilities={b2bCapabilities}
              activeCapabilityId={activeCapabilityId}
              isGuest={!isAuthenticated}
              petContext={petContext}
              aiUnavailable={aiUnavailable}
              pets={(user?.pets ?? []).map((p) => ({ id: p.id, name: p.name, species: p.species }))}
              activePetId={activePetId}
              onPetChange={setActivePetId}
              token={token}
              onAttachAttempt={handleAttach}
              onConfirmAction={
                aiUnavailable || !isAuthenticated
                  ? undefined
                  : (messageId) => void handleConfirmAction(messageId)
              }
              onCancelAction={
                aiUnavailable || !isAuthenticated
                  ? undefined
                  : (messageId) => handleCancelAction(messageId)
              }
            />
          </div>
        </div>

        {/* RIGHT — context */}
        <div className={cn("min-h-0 overflow-y-auto", mobileView !== "context" && "hidden lg:block")}>
          <AIContextPanel
            activeCapability={activeCapability}
            petContext={petContext}
            activePetId={activePetId}
          />
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
