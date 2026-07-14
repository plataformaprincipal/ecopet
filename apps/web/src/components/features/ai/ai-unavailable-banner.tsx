"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_MESSAGE =
  "Os recursos de inteligência artificial ainda não estão disponíveis neste ambiente.";

type Props = {
  message?: string;
  title?: string;
  className?: string;
};

/** Banner reutilizável quando a API retorna AI_NOT_CONFIGURED (ou equivalente). */
export function AiUnavailableBanner({
  message = DEFAULT_MESSAGE,
  title = "IA indisponível",
  className,
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
        className
      )}
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed opacity-90">{message}</p>
      </div>
    </div>
  );
}

export function isAiNotConfiguredErrorCode(code?: string | null): boolean {
  return (
    code === "AI_NOT_CONFIGURED" ||
    code === "AI_KEY_MISSING" ||
    code === "AI_PROVIDER_NOT_CONFIGURED"
  );
}
