"use client";

import { useMemo } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useTheme } from "next-themes";
import { useTranslation } from "@/providers/i18n-provider";
import { getTurnstilePublicConfig } from "@/lib/turnstile/config";
import type { TurnstileAction } from "@/lib/turnstile/actions";
import { cn } from "@/lib/utils";

export type TurnstileWidgetProps = {
  action: TurnstileAction;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  onLoad?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  resetKey?: number;
  className?: string;
  /** Quando false, oculta se integração desabilitada. */
  required?: boolean;
};

export function TurnstileWidget({
  action,
  onVerify,
  onExpire,
  onError,
  onLoad,
  theme = "auto",
  size = "flexible",
  resetKey = 0,
  className,
  required = true,
}: TurnstileWidgetProps) {
  const { resolvedTheme } = useTheme();
  const { locale, t } = useTranslation();
  const publicConfig = useMemo(() => getTurnstilePublicConfig(), []);

  const widgetTheme =
    theme === "auto" ? (resolvedTheme === "dark" ? "dark" : "light") : theme;

  const language = useMemo(() => {
    if (locale?.startsWith("es")) return "es";
    if (locale?.startsWith("en")) return "en";
    return "pt-BR";
  }, [locale]);

  // Integração desligada / sem Site Key: não renderiza (backend também pula).
  if (!publicConfig.enabled || !publicConfig.siteKey) {
    if (!required) return null;
    return null;
  }

  return (
    <div
      className={cn("w-full min-h-[65px]", className)}
      data-turnstile-action={action}
      data-reset-key={resetKey}
    >
      <Turnstile
        key={`${action}-${resetKey}`}
        siteKey={publicConfig.siteKey}
        options={{
          action,
          theme: widgetTheme,
          size,
          language,
          appearance: "always",
        }}
        onSuccess={onVerify}
        onExpire={() => onExpire?.()}
        onError={() => onError?.()}
        onWidgetLoad={() => onLoad?.()}
        aria-label={t("turnstile.required")}
      />
    </div>
  );
}
