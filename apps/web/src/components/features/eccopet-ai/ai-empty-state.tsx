"use client";

import { Sparkles } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import type { ResolvedCapability } from "@/lib/ai/capabilities/registry";
import type { PetAIContext } from "@/lib/ai/pet-context";
import { AISuggestionChips } from "./ai-suggestion-chips";
import { AICapabilityCards } from "./ai-capability-cards";

export function AIEmptyState({
  onSendSuggestion,
  onSelectCapability,
  onLoginRequired,
  quickPromptKeys,
  b2cCapabilities,
  b2bCapabilities,
  activeCapabilityId,
  isGuest,
  petContext,
}: {
  onSendSuggestion: (text: string) => void;
  onSelectCapability: (cap: ResolvedCapability, prompt: string) => void;
  onLoginRequired?: () => void;
  quickPromptKeys?: string[];
  b2cCapabilities: ResolvedCapability[];
  b2bCapabilities: ResolvedCapability[];
  activeCapabilityId?: string | null;
  isGuest: boolean;
  petContext?: PetAIContext | null;
}) {
  const { t } = useTranslation();

  const heroTitle = t("ecopetAi.heroTitle");
  const heroSub = isGuest
    ? t("ecopetAi.heroGuest")
    : petContext
      ? t("ecopetAi.heroWithPet", { petName: petContext.name })
      : t("ecopetAi.heroAuthenticated");

  const chips =
    quickPromptKeys?.map((key) => t(key)) ??
    [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:py-10">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ecopet-green/10 text-ecopet-green">
          <Sparkles className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-[var(--ep-fg)] sm:text-3xl">{heroTitle}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--ep-fg-muted)]">{heroSub}</p>
      </div>

      {chips.length > 0 ? (
        <AISuggestionChips suggestions={chips} onSelect={onSendSuggestion} className="mt-6 justify-center" />
      ) : null}

      <div className="mt-8">
        <AICapabilityCards
          title={t("ecopetAi.capabilities.b2cTitle")}
          capabilities={b2cCapabilities}
          activeId={activeCapabilityId}
          onSelect={onSelectCapability}
          onLoginRequired={onLoginRequired}
          compact
          className="lg:hidden"
        />
        <AICapabilityCards
          title={t("ecopetAi.capabilities.b2cTitle")}
          capabilities={b2cCapabilities}
          activeId={activeCapabilityId}
          onSelect={onSelectCapability}
          onLoginRequired={onLoginRequired}
          className="hidden lg:block"
        />
      </div>

      {b2bCapabilities.length > 0 ? (
        <div className="mt-8">
          <AICapabilityCards
            title={t("ecopetAi.capabilities.b2bTitle")}
            capabilities={b2bCapabilities}
            activeId={activeCapabilityId}
            onSelect={onSelectCapability}
            onLoginRequired={onLoginRequired}
          />
        </div>
      ) : null}
    </div>
  );
}
