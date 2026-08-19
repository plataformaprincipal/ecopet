"use client";

import Link from "next/link";
import { ChevronDown, History, Plus, Settings2, Sparkles } from "lucide-react";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { LanguageSelector } from "@/components/features/i18n/language-selector";
import { ThemeToggle } from "@/components/shared/theme/theme-toggle";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { PetAIContext } from "@/lib/ai/pet-context";
import type { ResolvedCapability } from "@/lib/ai/capabilities/registry";

type Props = {
  isAuthenticated: boolean;
  aiConfigured: boolean;
  activeCapability?: ResolvedCapability | null;
  petContext?: PetAIContext | null;
  pets?: { id: string; name: string }[];
  activePetId?: string | null;
  onPetChange?: (id: string) => void;
  onNewConversation: () => void;
  onOpenHistory?: () => void;
  className?: string;
};

export function AIWorkspaceHeader({
  isAuthenticated,
  aiConfigured,
  activeCapability,
  petContext,
  pets = [],
  activePetId,
  onPetChange,
  onNewConversation,
  onOpenHistory,
  className,
}: Props) {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2.5 shadow-[var(--shadow-xs)]",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <EcoPetLogo href="/eccopet" size="sm" showText />
        <div className="hidden min-w-0 sm:block">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ep-fg)]">
            <Sparkles className="h-4 w-4 text-ecopet-green" aria-hidden />
            EccoPet AI
          </p>
          {activeCapability ? (
            <p className="truncate text-[11px] text-[var(--ep-fg-muted)]">{t(activeCapability.nameKey)}</p>
          ) : (
            <p className="text-[11px] text-[var(--ep-fg-muted)]">
              {aiConfigured ? t("ecopetAi.header.ready") : t("ecopetAi.header.unavailable")}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {isAuthenticated && pets.length > 0 ? (
          <label className="relative flex min-h-[36px] items-center gap-1 rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg-muted)] pl-3 pr-2 text-xs">
            <span className="sr-only">{t("ecopetAi.header.activePet")}</span>
            <span className="hidden text-[var(--ep-fg-muted)] sm:inline">{t("ecopetAi.header.pet")}</span>
            <select
              value={activePetId ?? pets[0]?.id ?? ""}
              onChange={(e) => onPetChange?.(e.target.value)}
              className="max-w-[120px] truncate bg-transparent py-1.5 text-xs font-medium text-[var(--ep-fg)] focus:outline-none"
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--ep-fg-subtle)]" aria-hidden />
          </label>
        ) : petContext ? (
          <span className="rounded-full bg-ecopet-green/10 px-3 py-1.5 text-xs font-medium text-ecopet-green">
            {petContext.name}
          </span>
        ) : null}

        <button
          type="button"
          onClick={onNewConversation}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--ep-border)] px-3 py-1.5 text-xs font-medium text-[var(--ep-fg)] transition hover:bg-[var(--ep-bg-muted)]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{t("ecopetAi.sidebar.newConversation")}</span>
        </button>

        {onOpenHistory ? (
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--ep-border)] text-[var(--ep-fg-muted)] hover:bg-[var(--ep-bg-muted)] lg:hidden"
            aria-label={t("ecopetAi.mobile.conversations")}
          >
            <History className="h-4 w-4" aria-hidden />
          </button>
        ) : null}

        <ThemeToggle size="sm" className="hidden sm:inline-flex" />
        <LanguageSelector compact className="shrink-0" />

        {!isAuthenticated ? (
          <>
            <Link
              href="/login?callbackUrl=%2Feccopet"
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-[var(--ep-fg-muted)] hover:text-ecopet-green sm:inline-block"
            >
              {t("ecopetAi.topbar.signIn")}
            </Link>
            <Link
              href="/cadastro"
              className="rounded-full bg-ecopet-green px-3.5 py-1.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-ecopet-green-700"
            >
              {t("ecopetAi.topbar.createAccount")}
            </Link>
          </>
        ) : (
          <Link
            href="/perfil"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--ep-border)] text-[var(--ep-fg-muted)] hover:bg-[var(--ep-bg-muted)]"
            aria-label={t("nav.profile")}
          >
            <Settings2 className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
    </header>
  );
}
