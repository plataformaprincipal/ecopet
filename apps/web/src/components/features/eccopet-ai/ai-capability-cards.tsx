"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import type { ResolvedCapability } from "@/lib/ai/capabilities/registry";
import { CAPABILITY_ICON_MAP } from "@/lib/ai/capabilities/icons";

type Props = {
  capabilities: ResolvedCapability[];
  activeId?: string | null;
  onSelect: (cap: ResolvedCapability, prompt: string) => void;
  onLoginRequired?: () => void;
  title?: string;
  className?: string;
  compact?: boolean;
};

export function AICapabilityCards({
  capabilities,
  activeId,
  onSelect,
  onLoginRequired,
  title,
  className,
  compact,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={cn("w-full", className)}>
      {title ? (
        <h2 className="mb-3 text-sm font-semibold text-[var(--ep-fg-muted)]">{title}</h2>
      ) : null}
      <div
        className={cn(
          "grid gap-3",
          compact
            ? "grid-flow-col auto-cols-[min(260px,78vw)] overflow-x-auto pb-1 snap-x snap-mandatory"
            : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-2"
        )}
      >
        {capabilities.map((cap) => {
          const Icon = CAPABILITY_ICON_MAP[cap.icon];
          const isActive = activeId === cap.id;
          const isLocked = cap.availability === "locked";
          const isDisabled = cap.availability === "disabled";
          const isPartial = cap.availability === "partial";
          const canUse = cap.availability === "available" || cap.availability === "partial";

          return (
            <button
              key={cap.id}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isLocked) {
                  onLoginRequired?.();
                  return;
                }
                if (!canUse) return;
                onSelect(cap, t(cap.defaultPromptKey));
              }}
              aria-pressed={isActive}
              aria-disabled={isDisabled || isLocked}
              className={cn(
                "group snap-start rounded-2xl border p-4 text-left transition",
                "border-[var(--ep-border)] bg-[var(--ep-bg-elevated)]",
                "hover:border-ecopet-green/40 hover:shadow-[var(--shadow-sm)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ep-ring)]",
                isActive && "border-ecopet-green/50 ring-1 ring-ecopet-green/30",
                (isDisabled || isLocked) && "opacity-80",
                isDisabled && "cursor-not-allowed hover:border-[var(--ep-border)] hover:shadow-none"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    canUse ? "bg-ecopet-green/10 text-ecopet-green" : "bg-[var(--ep-bg-muted)] text-[var(--ep-fg-subtle)]"
                  )}
                >
                  {isLocked ? (
                    <Lock className="h-4 w-4" aria-hidden />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--ep-fg)]">{t(cap.nameKey)}</p>
                    {isPartial ? (
                      <span className="rounded-full bg-[var(--ep-warning-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--ep-warning)]">
                        {t("ecopetAi.capabilities.badgePartial")}
                      </span>
                    ) : null}
                    {isDisabled ? (
                      <span className="rounded-full bg-[var(--ep-bg-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--ep-fg-subtle)]">
                        {t("ecopetAi.capabilities.badgeDisabled")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--ep-fg-muted)]">
                    {t(cap.descriptionKey)}
                  </p>
                  {cap.exampleKeys[0] ? (
                    <p className="mt-2 truncate text-[11px] text-[var(--ep-fg-subtle)]">
                      “{t(cap.exampleKeys[0])}”
                    </p>
                  ) : null}
                  {isLocked && cap.lockReason === "login" ? (
                    <p className="mt-2 text-[11px] font-medium text-ecopet-green">{t("ecopetAi.capabilities.signInToUse")}</p>
                  ) : null}
                  {isLocked && cap.lockReason === "pet" ? (
                    <Link
                      href="/pets"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-block text-[11px] font-medium text-ecopet-green hover:underline"
                    >
                      {t("ecopetAi.context.registerPet")}
                    </Link>
                  ) : null}
                  {isDisabled && cap.disabledReasonKey ? (
                    <p className="mt-2 text-[11px] text-[var(--ep-fg-subtle)]">{t(cap.disabledReasonKey)}</p>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {capabilities.some((c) => c.availability === "available") ? (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--ep-fg-subtle)]">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t("ecopetAi.capabilities.poweredBy")}
        </p>
      ) : null}
    </div>
  );
}
