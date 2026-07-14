"use client";

import {
  Plus,
  MessageCircle,
  Apple,
  CalendarClock,
  Syringe,
  ShoppingBag,
  Heart,
  Scissors,
  Stethoscope,
  History,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import type { AIConversation } from "./types";

export type AIPreset = { id: string; title: string; prompt: string; icon: LucideIcon };

/** Ids mapeiam para ecopetAi.presets.<id>.{title,prompt} */
const PRESET_DEFS: { id: string; icon: LucideIcon }[] = [
  { id: "assistant", icon: MessageCircle },
  { id: "food", icon: Apple },
  { id: "routine", icon: CalendarClock },
  { id: "vaccines", icon: Syringe },
  { id: "products", icon: ShoppingBag },
  { id: "adoption", icon: Heart },
  { id: "services", icon: Scissors },
  { id: "consultations", icon: Stethoscope },
];

export function AIConversationSidebar({
  conversations,
  activeId,
  onNew,
  onSelect,
  onDelete,
  onSelectPreset,
  className,
}: {
  conversations: AIConversation[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelectPreset: (preset: AIPreset) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const presets: AIPreset[] = PRESET_DEFS.map((p) => ({
    id: p.id,
    icon: p.icon,
    title: t(`ecopetAi.presets.${p.id}.title`),
    prompt: t(`ecopetAi.presets.${p.id}.prompt`),
  }));
  return (
    <aside className={cn("flex flex-col gap-4", className)} aria-label={t("ecopetAi.sidebar.history")}>
      <button
        type="button"
        onClick={onNew}
        className="flex items-center justify-center gap-2 rounded-2xl bg-ecopet-green px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-ecopet-green/25 transition hover:bg-emerald-700"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t("ecopetAi.sidebar.newConversation")}
      </button>

      <nav className="rounded-3xl border border-zinc-200/70 bg-white/70 p-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50">
        <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("ecopetAi.sidebar.shortcuts")}</h2>
        <ul>
          {presets.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelectPreset(p)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100/70 hover:text-ecopet-green dark:text-zinc-300 dark:hover:bg-white/5"
              >
                <p.icon className="h-4 w-4 shrink-0" aria-hidden />
                {p.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-h-0 flex-1 rounded-3xl border border-zinc-200/70 bg-white/70 p-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50">
        <h2 className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          <History className="h-3.5 w-3.5" aria-hidden />
          {t("ecopetAi.sidebar.history")}
        </h2>
        {conversations.length === 0 ? (
          <p className="px-3 py-2 text-xs text-zinc-400">{t("ecopetAi.sidebar.historyEmpty")}</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id} className="group relative flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={activeId === c.id ? "true" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 truncate rounded-2xl px-3 py-2 text-left text-sm transition",
                    activeId === c.id
                      ? "bg-ecopet-green/10 font-medium text-ecopet-green"
                      : "text-zinc-600 hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:bg-white/5"
                  )}
                >
                  <MessageCircle className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                  <span className="truncate">{c.title}</span>
                </button>
                {onDelete ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    aria-label={t("ecopetAi.sidebar.delete")}
                    title={t("ecopetAi.sidebar.delete")}
                    className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
