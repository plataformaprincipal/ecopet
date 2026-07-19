"use client";

import { useTranslation } from "@/providers/i18n-provider";
import type { TurnstileWidgetState } from "@/lib/turnstile/types";
import { cn } from "@/lib/utils";

const STATE_KEYS = {
  idle: "turnstile.waiting",
  loading: "turnstile.verifying",
  ready: "turnstile.waiting",
  verified: "turnstile.verified",
  expired: "turnstile.expired",
  error: "turnstile.failed",
  unavailable: "turnstile.unavailable",
} as const;

type TurnstileStatusProps = {
  state: TurnstileWidgetState;
  className?: string;
};

export function TurnstileStatus({ state, className }: TurnstileStatusProps) {
  const { t } = useTranslation();
  const message = t(STATE_KEYS[state]);

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "text-sm",
        state === "verified" && "text-ecopet-green",
        (state === "error" || state === "expired" || state === "unavailable") &&
          "text-red-600 dark:text-red-400",
        state !== "verified" &&
          state !== "error" &&
          state !== "expired" &&
          state !== "unavailable" &&
          "text-ecopet-gray dark:text-white/70",
        className
      )}
    >
      {message}
    </p>
  );
}
