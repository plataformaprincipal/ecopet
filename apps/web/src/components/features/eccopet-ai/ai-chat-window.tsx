"use client";

import { useEffect, useRef } from "react";
import type { ResolvedCapability } from "@/lib/ai/capabilities/registry";
import { isWorkspaceCapability } from "@/lib/ai/capabilities/orchestrate";
import type { PetAIContext } from "@/lib/ai/pet-context";
import { AIMessageBubble } from "./ai-message-bubble";
import { AIPromptBox } from "./ai-prompt-box";
import { AIEmptyState } from "./ai-empty-state";
import { AIDisclaimer } from "./ai-disclaimer";
import { LostPetWorkspace } from "./lost-pet-workspace";
import { TravelWorkspace } from "./travel-workspace";
import { ContentStudioWorkspace } from "./content-studio-workspace";
import type { AIMessage } from "./types";

export function AIChatWindow({
  messages,
  loading,
  conversationId,
  onSend,
  onCancel,
  onRegenerate,
  onAttachAttempt,
  onConfirmAction,
  onCancelAction,
  onSelectCapability,
  onLoginRequired,
  quickPromptKeys,
  b2cCapabilities,
  b2bCapabilities,
  activeCapabilityId,
  isGuest,
  petContext,
  aiUnavailable,
  pets = [],
  activePetId,
  onPetChange,
  token,
}: {
  messages: AIMessage[];
  loading: boolean;
  conversationId?: string | null;
  onSend: (text: string) => void;
  onCancel?: () => void;
  onRegenerate?: () => void;
  onAttachAttempt?: () => void;
  onConfirmAction?: (messageId: string) => void;
  onCancelAction?: (messageId: string) => void;
  onSelectCapability: (cap: ResolvedCapability, prompt: string) => void;
  onLoginRequired?: () => void;
  quickPromptKeys?: string[];
  b2cCapabilities: ResolvedCapability[];
  b2bCapabilities: ResolvedCapability[];
  activeCapabilityId?: string | null;
  isGuest: boolean;
  petContext?: PetAIContext | null;
  aiUnavailable?: boolean;
  pets?: { id: string; name: string; species: string }[];
  activePetId?: string | null;
  onPetChange?: (id: string) => void;
  token?: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;
  const showCareDisclaimer = activeCapabilityId === "care_navigator";
  const showWorkspace = isWorkspaceCapability(activeCapabilityId);
  const lastAssistantText = [...messages].reverse().find((m) => m.role === "assistant" && !m.pending)?.content;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant" && !m.pending)?.id;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto" aria-live="polite" aria-relevant="additions">
        {showWorkspace && activeCapabilityId === "lost_pet" ? (
          <LostPetWorkspace
            pets={pets}
            petContext={petContext}
            activePetId={activePetId}
            onPetChange={onPetChange}
            token={token}
            isGuest={isGuest}
            onLoginRequired={onLoginRequired}
            onAskAi={onSend}
          />
        ) : null}
        {showWorkspace && activeCapabilityId === "travel_agent" ? (
          <TravelWorkspace
            pets={pets}
            petContext={petContext}
            activePetId={activePetId}
            onPetChange={onPetChange}
            onAskAi={onSend}
          />
        ) : null}
        {showWorkspace && activeCapabilityId === "content_studio" ? (
          <ContentStudioWorkspace
            pets={pets}
            petContext={petContext}
            activePetId={activePetId}
            onPetChange={onPetChange}
            onAskAi={onSend}
            lastAssistantText={lastAssistantText}
            generating={loading}
          />
        ) : null}

        {isEmpty && !showWorkspace ? (
          <AIEmptyState
            onSendSuggestion={onSend}
            onSelectCapability={onSelectCapability}
            onLoginRequired={onLoginRequired}
            quickPromptKeys={quickPromptKeys}
            b2cCapabilities={b2cCapabilities}
            b2bCapabilities={b2bCapabilities}
            activeCapabilityId={activeCapabilityId}
            isGuest={isGuest}
            petContext={petContext}
          />
        ) : !isEmpty ? (
          <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
            {messages.map((m) => (
              <AIMessageBubble
                key={m.id}
                message={m}
                conversationId={conversationId ?? undefined}
                showRegenerate={Boolean(onRegenerate) && m.id === lastAssistantId && !loading}
                onRegenerate={onRegenerate}
                onConfirmAction={onConfirmAction}
                onCancelAction={onCancelAction}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-[var(--ep-border)] bg-[var(--ep-bg-elevated)]/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl space-y-2">
          <AIPromptBox
            onSend={onSend}
            disabled={loading || aiUnavailable}
            loading={loading}
            onCancel={onCancel}
            onAttachAttempt={onAttachAttempt}
          />
          <AIDisclaimer variant={showCareDisclaimer ? "care" : "default"} />
        </div>
      </div>
    </div>
  );
}
