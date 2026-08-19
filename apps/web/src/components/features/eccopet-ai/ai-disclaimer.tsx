"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

export function AIDisclaimer({
  className,
  variant,
}: {
  className?: string;
  variant?: "default" | "care";
}) {
  const { t } = useTranslation();
  const text =
    variant === "care" ? t("ecopetAi.capabilities.careDisclaimer") : t("ecopetAi.fullDisclaimer");
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-center text-[11px] leading-snug text-[var(--ep-fg-subtle)]",
        className
      )}
      role="note"
    >
      <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
      <span>{text}</span>
    </p>
  );
}
