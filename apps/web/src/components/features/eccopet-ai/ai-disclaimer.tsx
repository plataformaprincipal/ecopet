"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

export function AIDisclaimer({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-center text-[11px] leading-snug text-zinc-400",
        className
      )}
      role="note"
    >
      <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
      <span>{t("ecopetAi.fullDisclaimer")}</span>
    </p>
  );
}
