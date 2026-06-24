"use client";

import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EccoPetToolStatus } from "@/lib/public/eccopet-tools";

type AIToolCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  status: EccoPetToolStatus;
  onTry?: () => void;
  onFullUse?: () => void;
};

const STATUS_LABEL: Record<EccoPetToolStatus, string> = {
  demo: "Demonstração",
  coming_soon: "Em breve",
  available: "Disponível",
};

export function AIToolCard({ title, description, icon: Icon, status, onTry, onFullUse }: AIToolCardProps) {
  const disabled = status === "coming_soon";

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[20px] border border-zinc-200/80 bg-gradient-to-br from-white via-white to-ecopet-green/5 p-6 shadow-sm transition hover:shadow-lg dark:border-white/10 dark:from-zinc-900/80 dark:to-ecopet-green/10",
        disabled && "opacity-80"
      )}
    >
      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-ecopet-green/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ecopet-green">
        <Sparkles className="h-3 w-3" aria-hidden />
        IA
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ecopet-green/20 to-ecopet-yellow/20">
        <Icon className="h-7 w-7 text-ecopet-green" aria-hidden />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            status === "coming_soon"
              ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              : "bg-ecopet-yellow/20 text-ecopet-dark"
          )}
        >
          {STATUS_LABEL[status]}
        </span>
        {status === "demo" && onTry ? (
          <Button size="sm" variant="outline" className="rounded-xl" onClick={onTry}>
            Testar demo
          </Button>
        ) : null}
        {status === "available" && onFullUse ? (
          <Button size="sm" className="rounded-xl" onClick={onFullUse}>
            Usar
          </Button>
        ) : null}
      </div>
    </article>
  );
}
